import { dayOf, type TimelineEvent } from "../timeline";

/**
 * Metric primitives (Sprint 2.14). Deterministic helpers shared by every metric
 * engine: windowing the event stream, counting by kind, summing metadata,
 * building daily series and clamping scores. Pure, side-effect-free.
 */

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function pct(part: number, whole: number): number {
  return whole > 0 ? clampScore((part / whole) * 100) : 0;
}

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

/** Inclusive [from, to] YYYY-MM-DD window filter over the event stream. */
export function eventsInWindow(events: TimelineEvent[], from: string, to: string): TimelineEvent[] {
  const lo = `${from}T00:00:00.000Z`;
  const hi = `${to}T23:59:59.999Z`;
  return events.filter((e) => e.timestamp >= lo && e.timestamp <= hi);
}

export function countKind(events: TimelineEvent[], eventType: string): number {
  return events.filter((e) => e.eventType === eventType).length;
}

export function metaNumber(e: TimelineEvent, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = e.metadata[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

/** Sum a numeric metadata field across events of a given kind (or all). */
export function sumMeta(events: TimelineEvent[], key: string, eventType?: string): number {
  return events
    .filter((e) => (eventType ? e.eventType === eventType : true))
    .reduce((acc, e) => acc + (metaNumber(e, key) ?? 0), 0);
}

/** Event counts per calendar day (YYYY-MM-DD → count), oldest first. */
export function dailyCounts(events: TimelineEvent[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of events) map.set(dayOf(e.timestamp), (map.get(dayOf(e.timestamp)) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
}

export function peakDay(events: TimelineEvent[]): { date: string; count: number } | null {
  let best: { date: string; count: number } | null = null;
  for (const d of dailyCounts(events)) {
    if (!best || d.count > best.count) best = d;
  }
  return best;
}

export function activeDays(events: TimelineEvent[]): number {
  return new Set(events.map((e) => dayOf(e.timestamp))).size;
}
