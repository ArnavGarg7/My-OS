/**
 * Personal Life Platform constants (Sprint 4.2). The deterministic life-management layer:
 * habits, routines, advanced health (medication/supplements/workouts/injuries/body/
 * appointments), readiness expansion and personal growth. Extends — never replaces —
 * Health (2.9), Goals (2.12) and Knowledge (4.1). No AI, no randomness; Phase 5 consumes
 * these systems rather than implementing them.
 *
 * Tasks: what should I do today? · Goals: what am I trying to achieve? · Habits: what
 * should I repeatedly do? · Routines: how should my day flow? · Health: am I capable of
 * performing at my best?
 */

export const HABIT_FREQUENCIES = ["daily", "weekly", "monthly", "custom"] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const ROUTINE_TYPES = [
  "morning",
  "evening",
  "workout",
  "study",
  "travel",
  "weekend",
  "custom",
] as const;
export type RoutineType = (typeof ROUTINE_TYPES)[number];

export const ROUTINE_STATUSES = ["active", "paused", "archived"] as const;
export type RoutineStatus = (typeof ROUTINE_STATUSES)[number];

export const EXERCISE_TYPES = ["strength", "cardio", "mobility", "sport", "recovery"] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const INJURY_STATUSES = ["active", "recovering", "healed"] as const;
export type InjuryStatus = (typeof INJURY_STATUSES)[number];

export const MEDICATION_FREQUENCIES = [
  "once_daily",
  "twice_daily",
  "thrice_daily",
  "weekly",
  "as_needed",
] as const;
export type MedicationFrequency = (typeof MEDICATION_FREQUENCIES)[number];

export const REVIEW_FREQUENCIES = ["weekly", "monthly", "quarterly", "annual"] as const;
export type ReviewFrequency = (typeof REVIEW_FREQUENCIES)[number];

/** Vision / life-area categories for personal growth (extends Goals). */
export const VISION_CATEGORIES = [
  "health",
  "career",
  "relationships",
  "finance",
  "learning",
  "personal",
  "spiritual",
  "recreation",
] as const;
export type VisionCategory = (typeof VISION_CATEGORIES)[number];

/** Readiness recommendation bands. */
export const RECOMMENDATION_LEVELS = ["push", "maintain", "ease", "rest"] as const;
export type RecommendationLevel = (typeof RECOMMENDATION_LEVELS)[number];

/** Streak is "at risk" when the habit is due today and not yet done. */
export const STREAK_AT_RISK_HOUR = 18; // 6pm local — after this, an undone daily habit is at risk

/** A habit's consistency window (days) used for completion-rate + recovery scoring. */
export const CONSISTENCY_WINDOW_DAYS = 30;

/** Readiness component weights (sum = 100). Deterministic, explainable. */
export const READINESS_WEIGHTS = {
  sleep: 25,
  recovery: 20,
  hydration: 10,
  nutrition: 10,
  workoutLoad: 15,
  injuries: 10,
  habitConsistency: 10,
} as const;

/** Training-load bands (weekly volume proxy) for the "training_load_high" signal. */
export const HIGH_TRAINING_LOAD = 1200; // arbitrary deterministic volume threshold

/** Days ahead within which an upcoming appointment counts as "soon". */
export const APPOINTMENT_SOON_DAYS = 2;

/** A routine is "skipped" if not completed by this many days after it was due. */
export const ROUTINE_SKIP_DAYS = 1;

/** Correlation strength bands. */
export const CORRELATION_MIN_SAMPLES = 5;
