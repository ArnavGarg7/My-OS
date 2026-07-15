import type { HighlightCategory } from "./constants";
import { buildDays, dayOf } from "./aggregator";
import { journalStreak } from "./streaks";
import type { TimelineEvent, TimelineHighlight } from "./types";

/**
 * Highlight engine (Sprint 2.13). Deterministic "best of" extraction over an
 * event set: biggest achievement, longest focus block, most productive day,
 * biggest spending day, best workout, largest journal streak. No AI — each is a
 * pure max/aggregate. Categories with no supporting data are omitted.
 */

function num(meta: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function maxBy(
  events: TimelineEvent[],
  score: (e: TimelineEvent) => number | null,
): { event: TimelineEvent; value: number } | null {
  let best: { event: TimelineEvent; value: number } | null = null;
  for (const e of events) {
    const v = score(e);
    if (v === null) continue;
    if (!best || v > best.value || (v === best.value && e.timestamp > best.event.timestamp)) {
      best = { event: e, value: v };
    }
  }
  return best;
}

export function computeHighlights(events: TimelineEvent[], today: string): TimelineHighlight[] {
  const out: TimelineHighlight[] = [];
  const push = (
    category: HighlightCategory,
    title: string,
    value: number,
    detail: string,
    eventId: string | null,
    at: string | null,
  ) => out.push({ category, title, value, detail, eventId, at });

  // Biggest achievement — highest-importance event.
  const achievement = maxBy(events, (e) => e.importance);
  if (achievement && achievement.value > 0) {
    push(
      "biggest_achievement",
      achievement.event.title,
      achievement.value,
      `${achievement.event.source} · importance ${achievement.value}`,
      achievement.event.id,
      achievement.event.timestamp,
    );
  }

  // Longest focus block — max focusMinutes on any event.
  const focus = maxBy(events, (e) => num(e.metadata, "focusMinutes", "minutes"));
  if (focus) {
    push(
      "longest_focus_block",
      `${focus.value} min of deep focus`,
      focus.value,
      focus.event.title,
      focus.event.id,
      focus.event.timestamp,
    );
  }

  // Most productive day — day with the most events.
  const days = buildDays(events);
  const busiest = days.reduce<(typeof days)[number] | null>(
    (best, d) => (!best || d.eventCount > best.eventCount ? d : best),
    null,
  );
  if (busiest && busiest.eventCount > 0) {
    push(
      "most_productive_day",
      busiest.date,
      busiest.eventCount,
      `${busiest.eventCount} events · ${busiest.completionScore}% completion`,
      null,
      `${busiest.date}T00:00:00.000Z`,
    );
  }

  // Biggest spending day — largest summed expense amount across a day.
  const spendByDay = new Map<string, number>();
  for (const e of events) {
    if (e.eventType !== "finance.transaction") continue;
    const amount = num(e.metadata, "amount");
    const direction = e.metadata["direction"];
    if (amount === null || direction === "income") continue;
    const day = dayOf(e.timestamp);
    spendByDay.set(day, (spendByDay.get(day) ?? 0) + Math.abs(amount));
  }
  let bigSpend: { day: string; total: number } | null = null;
  for (const [day, total] of spendByDay) {
    if (!bigSpend || total > bigSpend.total) bigSpend = { day, total };
  }
  if (bigSpend) {
    push(
      "biggest_spending_day",
      bigSpend.day,
      Math.round(bigSpend.total),
      `Spent ${Math.round(bigSpend.total)}`,
      null,
      `${bigSpend.day}T00:00:00.000Z`,
    );
  }

  // Best workout — health event with the highest intensity/duration.
  const workout = maxBy(events, (e) =>
    e.source === "health" ? num(e.metadata, "intensity", "durationMinutes", "duration") : null,
  );
  if (workout) {
    push(
      "best_workout",
      workout.event.title,
      workout.value,
      `${workout.event.summary}`,
      workout.event.id,
      workout.event.timestamp,
    );
  }

  // Largest journal streak.
  const streak = journalStreak(events, today);
  if (streak.length > 0) {
    push(
      "largest_journal_streak",
      `${streak.length}-day journal streak`,
      streak.length,
      streak.current ? "Currently active" : `Ended ${streak.end}`,
      null,
      streak.end ? `${streak.end}T00:00:00.000Z` : null,
    );
  }

  return out;
}
