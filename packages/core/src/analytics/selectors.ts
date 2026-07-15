import type { ReportType } from "./constants";
import { activeDays, peakDay, round } from "./metrics";
import { computeScores } from "./scoring";
import type { AnalyticsContext, AnalyticsStatistics } from "./types";
import { dayOf, type TimelineEvent } from "../timeline";

/**
 * Analytics selectors (Sprint 2.14). Read helpers over the analytics context:
 * period bounds, window slicing and aggregate statistics. Deterministic.
 */
const SPAN_DAYS: Record<ReportType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export function reportSpanDays(type: ReportType): number {
  return SPAN_DAYS[type];
}

/** Inclusive [start, end] YYYY-MM-DD bounds of the last `type` window ending now. */
export function periodBounds(type: ReportType, now: Date): { start: string; end: string } {
  const end = dayOf(now.toISOString());
  const start = new Date(now.getTime() - (SPAN_DAYS[type] - 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

export function statistics(ctx: AnalyticsContext, spanDays: number): AnalyticsStatistics {
  const days = activeDays(ctx.events);
  const scores = computeScores(ctx.events, spanDays, ctx);
  return {
    totalEvents: ctx.events.length,
    activeDays: days,
    averageEventsPerDay: days ? round(ctx.events.length / days, 1) : 0,
    overallScore: scores.overall,
    bestDay: peakDay(ctx.events),
  };
}

/** Events within the last `spanDays` ending at `now`, newest first. */
export function windowEvents(
  events: TimelineEvent[],
  spanDays: number,
  now: Date,
): TimelineEvent[] {
  const lo = new Date(now.getTime() - spanDays * 86_400_000).toISOString();
  return events
    .filter((e) => e.timestamp >= lo && e.timestamp <= now.toISOString())
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}
