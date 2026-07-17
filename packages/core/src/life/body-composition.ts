import type { BodyMeasurement } from "./types";

/**
 * Body composition (Sprint 4.2). Pure derivations over body measurements — latest values
 * and simple deterministic trends. No modelling.
 */
function sorted(measurements: BodyMeasurement[]): BodyMeasurement[] {
  return [...measurements].sort((a, b) => a.date.localeCompare(b.date));
}

export function latest(measurements: BodyMeasurement[]): BodyMeasurement | null {
  const s = sorted(measurements);
  return s[s.length - 1] ?? null;
}

/** Signed change in a field between the first and last measurement in the window. */
export function trend(
  measurements: BodyMeasurement[],
  field: "weightKg" | "bodyFatPercentage" | "restingHeartRate",
): number {
  const s = sorted(measurements).filter((m) => m[field] != null);
  if (s.length < 2) return 0;
  const first = s[0]![field] as number;
  const last = s[s.length - 1]![field] as number;
  return Number((last - first).toFixed(1));
}

/** Whether resting heart rate is trending down (a positive fitness signal). */
export function restingHeartRateImproving(measurements: BodyMeasurement[]): boolean {
  return trend(measurements, "restingHeartRate") < 0;
}
