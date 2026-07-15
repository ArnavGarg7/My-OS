import { chronological, dayOf } from "./aggregator";
import type { TimelineEvent, TimelineStreak } from "./types";

/**
 * Streak engine (Sprint 2.13). Computes the longest run of consecutive calendar
 * days on which at least one event matched a predicate, plus whether that run is
 * still current (extends to `today`). Deterministic — operates on UTC days.
 */

const DAY_MS = 86_400_000;

function addDays(date: string, n: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** Longest consecutive-day streak of events matching `predicate`. */
export function computeStreak(
  events: TimelineEvent[],
  predicate: (e: TimelineEvent) => boolean,
  label: string,
  today: string,
): TimelineStreak {
  const days = Array.from(
    new Set(
      chronological(events)
        .filter(predicate)
        .map((e) => dayOf(e.timestamp)),
    ),
  ).sort();

  if (days.length === 0) {
    return { label, length: 0, start: null, end: null, current: false };
  }

  let bestStart = days[0]!;
  let bestEnd = days[0]!;
  let bestLen = 1;
  let curStart = days[0]!;
  let curLen = 1;

  for (let i = 1; i < days.length; i++) {
    if (days[i] === addDays(days[i - 1]!, 1)) {
      curLen += 1;
    } else {
      curStart = days[i]!;
      curLen = 1;
    }
    if (curLen > bestLen) {
      bestLen = curLen;
      bestStart = curStart;
      bestEnd = days[i]!;
    }
  }

  const current = bestEnd === today || bestEnd === addDays(today, -1);
  return { label, length: bestLen, start: bestStart, end: bestEnd, current };
}

/** The journal-writing streak (a headline metric in Morning + reviews). */
export function journalStreak(events: TimelineEvent[], today: string): TimelineStreak {
  return computeStreak(events, (e) => e.source === "journal", "Journal streak", today);
}

/** The habit-completion streak. */
export function habitStreak(events: TimelineEvent[], today: string): TimelineStreak {
  return computeStreak(events, (e) => e.eventType === "habit.completed", "Habit streak", today);
}
