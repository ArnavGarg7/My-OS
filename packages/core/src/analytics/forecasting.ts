import { dailyCounts, mean } from "./metrics";
import type { Forecast } from "./types";
import { dayOf, type TimelineEvent } from "../timeline";

/**
 * Forecast engine (Sprint 2.14). Deterministic, rule-based projection: extend a
 * metric forward by its historical daily velocity (average change per day over
 * the lookback window). No predictive models — reproducible arithmetic only.
 */
export function forecastFromSeries(
  metric: string,
  series: { date: string; value: number }[],
  horizonDays: number,
): Forecast {
  const values = series.map((s) => s.value);
  // Velocity = average day-over-day delta.
  const deltas: number[] = [];
  for (let i = 1; i < values.length; i++) deltas.push(values[i]! - values[i - 1]!);
  const velocityPerDay = Math.round(mean(deltas) * 100) / 100;

  const last = values.length ? values[values.length - 1]! : 0;
  const projected = Math.round((last + velocityPerDay * horizonDays) * 100) / 100;

  return { metric, horizonDays, projected, velocityPerDay, basis: "historical-velocity" };
}

/** Forecast cumulative event volume over the horizon from daily counts. */
export function forecastEventVolume(events: TimelineEvent[], horizonDays: number): Forecast {
  const counts = dailyCounts(events);
  const perDay = mean(counts.map((c) => c.count));
  const velocityPerDay = Math.round(perDay * 100) / 100;
  const projected = Math.round(perDay * horizonDays * 100) / 100;
  return {
    metric: "timeline.events",
    horizonDays,
    projected,
    velocityPerDay,
    basis: "historical-velocity",
  };
}

/** Forecast a monotone progress metric (e.g. savings, goal %) to a horizon. */
export function forecastProgress(
  metric: string,
  progressSeries: { date: string; value: number }[],
  horizonDays: number,
  cap = 100,
): Forecast {
  const f = forecastFromSeries(metric, progressSeries, horizonDays);
  return { ...f, projected: Math.min(cap, Math.max(0, f.projected)) };
}

/** Helper: build a cumulative series from daily counts (oldest first). */
export function cumulativeSeries(events: TimelineEvent[]): { date: string; value: number }[] {
  let running = 0;
  return dailyCounts(events).map((d) => {
    running += d.count;
    return { date: dayOf(`${d.date}T00:00:00Z`), value: running };
  });
}
