import { activeDays, dailyCounts, peakDay, round } from "./metrics";
import type { TimelineMetrics } from "./types";
import { dayOf, type TimelineEvent } from "../timeline";

/**
 * Timeline analytics (Sprint 2.14). Consumes the immutable Timeline stream to
 * derive activity distribution, daily average, peak-productivity day and source
 * breakdown. No duplicated calculations — the Timeline is the source of truth.
 */
export function computeTimeline(events: TimelineEvent[]): TimelineMetrics {
  const bySource: Record<string, number> = {};
  for (const e of events) bySource[e.source] = (bySource[e.source] ?? 0) + 1;
  const days = activeDays(events);

  return {
    totalEvents: events.length,
    dailyAverage: days ? round(events.length / days, 1) : 0,
    bySource,
    peakDay: peakDay(events),
    activeDays: days,
  };
}

/** Daily activity series (oldest first) for charts. */
export function activitySeries(events: TimelineEvent[]): { date: string; count: number }[] {
  return dailyCounts(events);
}

/** Weekly activity totals keyed by ISO-ish week start (Mon), oldest first. */
export function weeklyActivity(events: TimelineEvent[]): { week: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of events) {
    const d = new Date(`${dayOf(e.timestamp)}T00:00:00Z`);
    const dayNum = (d.getUTCDay() + 6) % 7;
    const monday = new Date(d.getTime() - dayNum * 86_400_000).toISOString().slice(0, 10);
    map.set(monday, (map.get(monday) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, count]) => ({ week, count }));
}
