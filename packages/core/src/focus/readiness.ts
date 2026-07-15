import { readinessLevelFromScore, type ReadinessLevel } from "./constants";
import type { FocusReadiness } from "./types";

/**
 * Focus readiness (Sprint 3.2). This does NOT compute any health logic — it consumes
 * the readiness the Health engine (Sprint 2.9) already produced and maps it onto a
 * focus-oriented band + headline. All inputs come from Health signals.
 */
export interface HealthReadinessInput {
  score: number; // 0–100 from Health
  hydrationPercent: number;
  recovery: string; // Health recovery label
  sleepMinutes: number;
}

const HEADLINE: Record<ReadinessLevel, string> = {
  ready: "You're primed for deep work.",
  good: "Good conditions for focused work.",
  average: "Steady — pace yourself with breaks.",
  low: "Low readiness — keep sessions short.",
  recovery_needed: "Recovery needed — prioritise rest over deep work.",
};

export function buildReadiness(input: HealthReadinessInput | null): FocusReadiness {
  if (!input) {
    return {
      level: "average",
      score: 0,
      hydrationPercent: 0,
      recovery: "unknown",
      sleepMinutes: 0,
      headline: "No health data yet — log sleep to see readiness.",
    };
  }
  const score = Math.max(0, Math.min(100, Math.round(input.score)));
  const level = readinessLevelFromScore(score);
  return {
    level,
    score,
    hydrationPercent: Math.max(0, Math.min(100, Math.round(input.hydrationPercent))),
    recovery: input.recovery,
    sleepMinutes: Math.max(0, Math.round(input.sleepMinutes)),
    headline: HEADLINE[level],
  };
}

/** Whether readiness suggests avoiding intense deep work. */
export function shouldLowerIntensity(readiness: FocusReadiness): boolean {
  return readiness.level === "low" || readiness.level === "recovery_needed";
}
