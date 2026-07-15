import { TREND_WINDOW_DAYS } from "./constants";
import type { BodyMeasurement } from "./types";

/**
 * Body metrics engine (Sprint 2.9). Snapshots + simple deterministic trends
 * (latest, change over window, moving average). Advanced body-composition
 * analytics are deferred.
 */
export function latestMeasurement(measurements: BodyMeasurement[]): BodyMeasurement | null {
  if (measurements.length === 0) return null;
  return [...measurements].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)).at(-1)!;
}

export interface BodyTrend {
  latest: number | null;
  previous: number | null;
  change: number | null; // latest - previous
  direction: "up" | "down" | "flat" | "unknown";
  average: number | null;
}

export function weightTrend(
  measurements: BodyMeasurement[],
  window = TREND_WINDOW_DAYS,
): BodyTrend {
  return trend(measurements, "weight", window);
}

export function bodyFatTrend(
  measurements: BodyMeasurement[],
  window = TREND_WINDOW_DAYS,
): BodyTrend {
  return trend(measurements, "bodyFat", window);
}

function trend(
  measurements: BodyMeasurement[],
  key: "weight" | "bodyFat" | "muscleMass" | "waist",
  window: number,
): BodyTrend {
  const series = [...measurements]
    .filter((m) => m[key] !== null)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  if (series.length === 0) {
    return { latest: null, previous: null, change: null, direction: "unknown", average: null };
  }
  const values = series.map((m) => m[key] as number);
  const latest = values.at(-1)!;
  const previous = values.length > 1 ? values.at(-2)! : null;
  const change = previous === null ? null : Math.round((latest - previous) * 10) / 10;
  const recent = values.slice(-window);
  const average = Math.round((recent.reduce((s, v) => s + v, 0) / recent.length) * 10) / 10;
  return {
    latest,
    previous,
    change,
    direction:
      change === null ? "unknown" : change > 0.05 ? "up" : change < -0.05 ? "down" : "flat",
    average,
  };
}
