import { HEALTH_TARGETS } from "./constants";
import { clampScore } from "./metrics";
import type { HealthAnalyticsInput } from "./types";

/**
 * Health analytics (Sprint 2.14). Wraps the existing Health engine's summary
 * into a 0–100 wellness score: readiness, sleep, hydration, recovery and workout
 * consistency, each mapped to its target. Deterministic — no re-derivation.
 */
export interface HealthMetrics {
  avgReadiness: number;
  avgSleepMinutes: number;
  avgHydrationPercent: number;
  recoveryScore: number;
  workoutConsistency: number; // 0–100
  score: number; // 0–100
}

export function computeHealth(input?: HealthAnalyticsInput): HealthMetrics {
  const h = input ?? {
    avgReadiness: 0,
    avgSleepMinutes: 0,
    avgHydrationPercent: 0,
    recoveryScore: 0,
    workoutCount: 0,
  };
  const target = h.workoutTargetPerWeek ?? HEALTH_TARGETS.workoutsPerWeek;
  const workoutConsistency = clampScore((h.workoutCount / Math.max(1, target)) * 100);

  const readinessScore = clampScore((h.avgReadiness / HEALTH_TARGETS.readiness) * 100);
  const sleepScore = clampScore((h.avgSleepMinutes / HEALTH_TARGETS.sleepMinutes) * 100);
  const hydrationScore = clampScore(
    (h.avgHydrationPercent / HEALTH_TARGETS.hydrationPercent) * 100,
  );

  const score = clampScore(
    readinessScore * 0.3 +
      sleepScore * 0.25 +
      hydrationScore * 0.15 +
      h.recoveryScore * 0.15 +
      workoutConsistency * 0.15,
  );

  return {
    avgReadiness: Math.round(h.avgReadiness),
    avgSleepMinutes: Math.round(h.avgSleepMinutes),
    avgHydrationPercent: Math.round(h.avgHydrationPercent),
    recoveryScore: Math.round(h.recoveryScore),
    workoutConsistency,
    score,
  };
}
