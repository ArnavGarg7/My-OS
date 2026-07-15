import type { ComparisonPeriod } from "./constants";
import { eventsInWindow } from "./metrics";
import type { Comparison } from "./types";
import { dayOf, type TimelineEvent } from "../timeline";

/**
 * Comparison engine (Sprint 2.14). Compares a metric in the current period
 * against the immediately-preceding equivalent period (day/week/month/quarter/
 * year). Deterministic — periods are fixed-length windows ending at `now`.
 */
const PERIOD_DAYS: Record<ComparisonPeriod, number> = {
  previous_day: 1,
  previous_week: 7,
  previous_month: 30,
  previous_quarter: 90,
  previous_year: 365,
};

function windowBounds(now: Date, days: number, offset: number): { from: string; to: string } {
  const to = new Date(now.getTime() - offset * days * 86_400_000);
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  return { from: dayOf(from.toISOString()), to: dayOf(to.toISOString()) };
}

export function compareValues(
  metric: string,
  period: ComparisonPeriod,
  current: number,
  previous: number,
): Comparison {
  const delta = Math.round((current - previous) * 100) / 100;
  const changePercent =
    previous === 0
      ? current === 0
        ? 0
        : 100
      : Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
  const direction: Comparison["direction"] =
    Math.abs(changePercent) < 1 ? "flat" : changePercent > 0 ? "up" : "down";
  return { metric, period, current, previous, delta, changePercent, direction };
}

/** Compare event volume this period vs the previous equivalent period. */
export function compareEventVolume(
  events: TimelineEvent[],
  period: ComparisonPeriod,
  now: Date,
): Comparison {
  const days = PERIOD_DAYS[period];
  const cur = windowBounds(now, days, 0);
  const prev = windowBounds(now, days, 1);
  const current = eventsInWindow(events, cur.from, cur.to).length;
  const previous = eventsInWindow(events, prev.from, prev.to).length;
  return compareValues("timeline.events", period, current, previous);
}

/** Compare a specific kind's volume across periods. */
export function compareKind(
  events: TimelineEvent[],
  eventType: string,
  period: ComparisonPeriod,
  now: Date,
): Comparison {
  const filtered = events.filter((e) => e.eventType === eventType);
  return compareEventVolumeInternal(filtered, eventType, period, now);
}

function compareEventVolumeInternal(
  events: TimelineEvent[],
  metric: string,
  period: ComparisonPeriod,
  now: Date,
): Comparison {
  const days = PERIOD_DAYS[period];
  const cur = windowBounds(now, days, 0);
  const prev = windowBounds(now, days, 1);
  const current = eventsInWindow(events, cur.from, cur.to).length;
  const previous = eventsInWindow(events, prev.from, prev.to).length;
  return compareValues(metric, period, current, previous);
}
