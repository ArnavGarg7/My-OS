/**
 * Health domain constants (Sprint 2.9). The deterministic personal wellness
 * operating system — models sleep, recovery, readiness, nutrition, hydration,
 * exercise and body metrics. No AI, no randomness. Not medical advice.
 */

export const ENERGY_LEVELS = ["low", "medium", "high"] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const ENERGY_SCORE: Record<EnergyLevel, number> = { low: 30, medium: 65, high: 100 };

export const MOODS = ["poor", "okay", "good", "great"] as const;
export type Mood = (typeof MOODS)[number];

export const WORKOUT_TYPES = ["strength", "cardio", "mobility", "sport", "walk", "other"] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const RECOVERY_STATUSES = ["recovered", "recovering", "fatigued", "overtrained"] as const;
export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];

export const HYDRATION_SOURCES = ["water", "coffee", "tea", "other"] as const;
export type HydrationSource = (typeof HYDRATION_SOURCES)[number];

/** Default daily goals (single-user; overridable via preferences later). */
export const DEFAULT_GOALS = {
  waterMl: 3000,
  calories: 2200,
  proteinG: 140,
  sleepMinutes: 480, // 8h
  steps: 8000,
} as const;

/** Target sleep window for scoring (minutes). */
export const IDEAL_SLEEP_MINUTES = 480; // 8h
export const MIN_HEALTHY_SLEEP_MINUTES = 420; // 7h

/** RPE (rate of perceived exertion) scale bounds. */
export const RPE_MIN = 1;
export const RPE_MAX = 10;

/** Readiness weighting across its deterministic inputs (sum = 1). */
export const READINESS_WEIGHTS = {
  sleep: 0.35,
  recovery: 0.3,
  hydration: 0.15,
  energy: 0.2,
} as const;

/** Recovery score thresholds → status. */
export const RECOVERY_THRESHOLDS = { recovered: 80, recovering: 55, fatigued: 30 } as const;

/** Readiness bands for labels + planner hints. */
export const READINESS_BANDS = { high: 75, moderate: 50, low: 30 } as const;

/** MET-based calorie estimate per workout type (kcal per minute at ~75kg). */
export const CALORIE_PER_MIN: Record<WorkoutType, number> = {
  strength: 6,
  cardio: 10,
  mobility: 3,
  sport: 8,
  walk: 4,
  other: 5,
};

/** Rolling-average window (days) for sleep/readiness trends. */
export const TREND_WINDOW_DAYS = 7;

/** Macro calories-per-gram (Atwater). */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;
