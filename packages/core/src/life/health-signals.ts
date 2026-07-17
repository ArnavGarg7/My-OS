/**
 * Health signals bridge (Sprint 4.2). Normalizes the wellness inputs the readiness
 * expansion consumes. The server fills these from the existing Health engine (2.9) plus
 * the new life data — this module owns NO health logic, only the input contract + clamps.
 */
export interface ReadinessInputs {
  /** 0..100 from the Health engine's sleep score. */
  sleep: number;
  /** 0..100 recovery score. */
  recovery: number;
  /** 0..100 hydration completion. */
  hydration: number;
  /** 0..100 nutrition quality. */
  nutrition: number;
  /** Weekly training load (raw volume proxy). */
  workoutLoad: number;
  /** 0..100 injury burden (higher = worse). */
  injuryBurden: number;
  /** 0..100 habit consistency. */
  habitConsistency: number;
  /** Whether meds are outstanding today (small deterministic penalty). */
  medicationDue: boolean;
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** A neutral baseline used when a source is missing (keeps readiness explainable). */
export function defaultInputs(): ReadinessInputs {
  return {
    sleep: 60,
    recovery: 60,
    hydration: 60,
    nutrition: 60,
    workoutLoad: 0,
    injuryBurden: 0,
    habitConsistency: 60,
    medicationDue: false,
  };
}
