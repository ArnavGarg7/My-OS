import { DEFAULT_IMPORTANCE, EVENT_IMPORTANCE, type TimelineSource } from "./constants";
import type { TimelineDay, TimelineEvent, TimelineEventInput } from "./types";

/**
 * Aggregation engine (Sprint 2.13). Normalises raw event inputs into canonical
 * `TimelineEvent`s and rolls them up into a single chronological stream + daily
 * aggregates. Deterministic: importance/summary are derived, ties break by id.
 */

/** Deterministic importance for an event type. */
export function importanceFor(eventType: string, override?: number): number {
  if (typeof override === "number") return clampScore(override);
  return EVENT_IMPORTANCE[eventType] ?? DEFAULT_IMPORTANCE;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Materialise a raw input into a canonical event (id supplied by caller/DB). */
export function toEvent(input: TimelineEventInput, id: string): TimelineEvent {
  return {
    id,
    eventType: input.eventType,
    source: input.source,
    entityId: input.entityId ?? null,
    title: input.title,
    summary: input.summary ?? input.title,
    timestamp: input.timestamp ?? new Date().toISOString(),
    importance: importanceFor(input.eventType, input.importance),
    metadata: input.metadata ?? {},
  };
}

/** The one chronological stream: newest first, stable, de-duplicated by id. */
export function aggregate(events: TimelineEvent[]): TimelineEvent[] {
  const seen = new Set<string>();
  const unique: TimelineEvent[] = [];
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    unique.push(e);
  }
  return unique.sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp < b.timestamp ? 1 : -1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

/** Oldest-first order (for streaks / snapshots). */
export function chronological(events: TimelineEvent[]): TimelineEvent[] {
  return aggregate(events).slice().reverse();
}

export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

function num(meta: Record<string, unknown>, key: string): number | null {
  const v = meta[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Roll an event set for one calendar day into a `TimelineDay` aggregate.
 * Metric fields read from event metadata when present; absent metrics stay 0.
 */
export function computeDay(events: TimelineEvent[], date: string): TimelineDay {
  const forDay = events.filter((e) => dayOf(e.timestamp) === date);
  const completed = forDay.filter((e) => e.eventType === "task.completed").length;
  const created = forDay.filter((e) => e.eventType === "task.created").length;
  const totalTasks = completed + created;
  const focusMinutes = forDay.reduce((sum, e) => sum + (num(e.metadata, "focusMinutes") ?? 0), 0);
  const healthScores = forDay
    .map((e) => num(e.metadata, "healthScore") ?? num(e.metadata, "readiness"))
    .filter((n): n is number => n !== null);
  const plannerAccuracies = forDay
    .map((e) => num(e.metadata, "plannerAccuracy"))
    .filter((n): n is number => n !== null);

  return {
    date,
    eventCount: forDay.length,
    completionScore: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
    focusMinutes,
    healthScore: healthScores.length ? Math.round(mean(healthScores)) : 0,
    journalWritten: forDay.some((e) => e.source === "journal" && e.eventType.startsWith("journal")),
    plannerAccuracy: plannerAccuracies.length ? Math.round(mean(plannerAccuracies)) : 0,
  };
}

/** All non-empty daily aggregates, most-recent day first. */
export function buildDays(events: TimelineEvent[]): TimelineDay[] {
  const dates = Array.from(new Set(events.map((e) => dayOf(e.timestamp))));
  return dates.sort((a, b) => (a < b ? 1 : -1)).map((d) => computeDay(events, d));
}

/** Count of events per source. */
export function countBySource(events: TimelineEvent[]): Record<TimelineSource, number> {
  const out = {} as Record<TimelineSource, number>;
  for (const e of events) out[e.source] = (out[e.source] ?? 0) + 1;
  return out;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
