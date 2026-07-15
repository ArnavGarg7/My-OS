/**
 * Focus engine constants (Sprint 3.2). Focus Mode is where planned work is
 * executed. It composes the existing engines (Planner/Task/Calendar/Health/…) and
 * owns only execution state. Deterministic — every threshold lives here so timer,
 * break and metric calculations are reproducible. No AI, no randomness.
 */

/** Session kinds. Meeting sessions are separate; they cannot be deep-work focus. */
export const SESSION_TYPES = [
  "focus",
  "deep_work",
  "shallow_work",
  "review",
  "break",
  "recovery",
  "planning",
  "meeting",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

/** Which session types count as "work" (vs break/recovery/meeting). */
export const WORK_TYPES: readonly SessionType[] = [
  "focus",
  "deep_work",
  "shallow_work",
  "review",
  "planning",
];
/** Which session types count as "deep work" for metrics. */
export const DEEP_WORK_TYPES: readonly SessionType[] = ["focus", "deep_work"];

/** Session lifecycle status (DB enum `focus_status`). */
export const SESSION_STATUSES = [
  "idle",
  "running",
  "paused",
  "break",
  "completed",
  "cancelled",
  "abandoned",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Statuses in which the session clock is actively counting focus time. */
export const ACTIVE_STATUSES: readonly SessionStatus[] = ["running"];
/** Statuses that are terminal (archived). */
export const TERMINAL_STATUSES: readonly SessionStatus[] = ["completed", "cancelled", "abandoned"];

/** Break kinds (DB enum `break_type`). */
export const BREAK_TYPES = ["short", "long", "recovery", "hydration", "walk"] as const;
export type BreakType = (typeof BREAK_TYPES)[number];

/** Interruption sources. */
export const INTERRUPTION_TYPES = ["phone", "meeting", "message", "distraction", "other"] as const;
export type InterruptionType = (typeof INTERRUPTION_TYPES)[number];

/** Default planned session length (minutes) when none supplied. */
export const DEFAULT_SESSION_MINUTES = 50;
/** A long stretch of continuous work that warrants a recovery break (minutes). */
export const LONG_WORK_MINUTES = 90;
/** A standard work stretch that warrants a short break (minutes). */
export const STANDARD_WORK_MINUTES = 50;
/** Recommended short-break length (minutes). */
export const SHORT_BREAK_MINUTES = 10;
/** Recommended recovery-break length (minutes). */
export const RECOVERY_BREAK_MINUTES = 20;
/** Interruptions at/above this within a session are "high" and warrant a reset. */
export const HIGH_INTERRUPTION_COUNT = 4;
/** Sessions running past their plan by this many minutes are "overrunning". */
export const OVERRUN_MINUTES = 15;
/** Below this readiness (0–100) recommend a longer break / lower intensity. */
export const LOW_READINESS_SCORE = 55;

/** Readiness bands consumed from Health (Sprint 2.9) — never recomputed here. */
export const READINESS_LEVELS = ["ready", "good", "average", "low", "recovery_needed"] as const;
export type ReadinessLevel = (typeof READINESS_LEVELS)[number];

/** Map a 0–100 Health readiness score into a focus readiness band. */
export function readinessLevelFromScore(score: number): ReadinessLevel {
  if (score >= 85) return "ready";
  if (score >= 70) return "good";
  if (score >= LOW_READINESS_SCORE) return "average";
  if (score >= 35) return "low";
  return "recovery_needed";
}
