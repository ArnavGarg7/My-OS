/**
 * Trend Analysis (Sprint 6.2). Pure deterministic statistics over a numeric history: moving average,
 * velocity, least-squares slope, and a labelled Trend. No randomness, no AI. Every trend is
 * explainable by its own numbers.
 */
import type { Trend, TrendDirection } from "./types";

/** Simple moving average over the last `window` points (or all if fewer). */
export function movingAverage(series: readonly number[], window = series.length): number {
  if (series.length === 0) return 0;
  const w = Math.max(1, Math.min(window, series.length));
  const slice = series.slice(series.length - w);
  return round(slice.reduce((a, b) => a + b, 0) / w);
}

/** Least-squares slope (change per index step). 0 for <2 points. */
export function slope(series: readonly number[]): number {
  const n = series.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = series.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * ((series[i] ?? 0) - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : round(num / den);
}

/** Completion velocity: total / periods (e.g. tasks per day). */
export function velocity(total: number, periods: number): number {
  return periods <= 0 ? 0 : round(total / periods);
}

/** Coefficient of variation (stddev / |mean|) — lower = more stable. 0 for empty/constant. */
export function variability(series: readonly number[]): number {
  if (series.length < 2) return 0;
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  if (mean === 0) return 0;
  const varc = series.reduce((a, b) => a + (b - mean) ** 2, 0) / series.length;
  return round(Math.sqrt(varc) / Math.abs(mean));
}

/** Build a labelled Trend from a numeric history. `eps` is the flat-band around zero slope. */
export function computeTrend(metric: string, series: readonly number[], eps = 0.05): Trend {
  const s = slope(series);
  const direction: TrendDirection = s > eps ? "rising" : s < -eps ? "falling" : "flat";
  return {
    metric,
    direction,
    slope: s,
    movingAverage: movingAverage(series, Math.min(7, series.length || 1)),
    samples: series.length,
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
