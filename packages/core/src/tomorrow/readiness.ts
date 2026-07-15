import {
  DEFAULT_SLEEP_TARGET_MINUTES,
  LOW_READINESS,
  WORKING_DAY_MINUTES,
  intensityBand,
} from "./constants";
import type { ReadinessInput, TomorrowReadiness } from "./types";

/**
 * Readiness engine (Sprint 3.1). Deterministically prepares tomorrow: sleep
 * target, expected workload, meeting density, health readiness, focus
 * opportunity and a recovery recommendation. Entirely rule-based.
 */
function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeReadiness(input: ReadinessInput): TomorrowReadiness {
  const sleepTargetMinutes = input.sleepTargetMinutes ?? DEFAULT_SLEEP_TARGET_MINUTES;
  const meetingDensity = clamp((input.meetingMinutes / WORKING_DAY_MINUTES) * 100);
  const focusOpportunityMinutes = Math.max(
    0,
    WORKING_DAY_MINUTES - input.meetingMinutes - input.expectedWorkloadMinutes,
  );
  const intensity = intensityBand(input.expectedWorkloadMinutes + input.meetingMinutes);

  // Composite: health readiness dominates, penalised by meeting density + overload.
  const overloadPenalty = intensity === "heavy" ? 20 : intensity === "moderate" ? 8 : 0;
  const score = clamp(input.healthReadiness - meetingDensity * 0.3 - overloadPenalty);

  const recoveryRecommendation =
    score <= LOW_READINESS
      ? "Lower tomorrow's intensity — protect sleep and recovery."
      : intensity === "heavy"
        ? "Front-load deep work; keep the afternoon lighter."
        : "You're set for a productive day — protect your focus windows.";

  return {
    sleepTargetMinutes,
    expectedWorkloadMinutes: input.expectedWorkloadMinutes,
    meetingMinutes: input.meetingMinutes,
    meetingDensity,
    healthReadiness: clamp(input.healthReadiness),
    focusOpportunityMinutes,
    intensity,
    recoveryRecommendation,
    score,
  };
}
