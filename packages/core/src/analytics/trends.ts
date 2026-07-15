import { TREND_FLAT_THRESHOLD, TREND_WINDOWS, type TrendWindowKey } from "./constants";
import { dailyCounts, mean } from "./metrics";
import type { Trend } from "./types";
import { dayOf, type TimelineEvent } from "../timeline";

/**
 * Trend engine (Sprint 2.14). Given a daily numeric series, computes a
 * deterministic direction + signed change % by comparing the recent half of the
 * window against the older half. Windows: 7 / 30 / 90 / 365 days.
 */
export function direction(changePercent: number): Trend["direction"] {
  if (Math.abs(changePercent) < TREND_FLAT_THRESHOLD) return "flat";
  return changePercent > 0 ? "up" : "down";
}

function changePct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

/** Trend of a daily series over a window ending at `now`. */
export function trendOfSeries(
  metric: string,
  series: { date: string; value: number }[],
  window: TrendWindowKey,
  now: Date,
): Trend {
  const days = TREND_WINDOWS[window];
  const end = dayOf(now.toISOString());
  const start = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const mid = new Date(now.getTime() - (days / 2) * 86_400_000).toISOString().slice(0, 10);

  const inWindow = series.filter((s) => s.date >= start && s.date <= end);
  const older = inWindow.filter((s) => s.date < mid).map((s) => s.value);
  const recent = inWindow.filter((s) => s.date >= mid).map((s) => s.value);

  const previous = Math.round(mean(older) * 100) / 100;
  const current = Math.round(mean(recent) * 100) / 100;
  const changePercent = changePct(current, previous);

  return { metric, window, direction: direction(changePercent), changePercent, current, previous };
}

/** Trend of daily event volume from the Timeline. */
export function eventVolumeTrend(
  events: TimelineEvent[],
  window: TrendWindowKey,
  now: Date,
): Trend {
  const series = dailyCounts(events).map((d) => ({ date: d.date, value: d.count }));
  return trendOfSeries("timeline.events", series, window, now);
}

/** Trend of a specific event-kind's daily volume. */
export function kindTrend(
  events: TimelineEvent[],
  eventType: string,
  window: TrendWindowKey,
  now: Date,
): Trend {
  const series = dailyCounts(events.filter((e) => e.eventType === eventType)).map((d) => ({
    date: d.date,
    value: d.count,
  }));
  return trendOfSeries(eventType, series, window, now);
}
