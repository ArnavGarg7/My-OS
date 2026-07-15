import type {
  EnergyLevel,
  HydrationSource,
  MealType,
  Mood,
  RecoveryStatus,
  WorkoutType,
} from "./constants";

/**
 * Health domain types (Sprint 2.9). Raw logged entities + the derived analytics
 * (sleep score, recovery, readiness, summaries). Derived values are always
 * computed, never stored.
 */
export interface HealthDaily {
  date: string; // YYYY-MM-DD
  energyLevel: EnergyLevel | null;
  mood: Mood | null;
  stress: number | null; // 0–10
  waterMl: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  steps: number;
  weight: number | null; // kg
  bodyFat: number | null; // %
  notes: string;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  startedAt: string; // ISO
  endedAt: string | null; // ISO
  durationMinutes: number;
  volume: number; // e.g. total kg lifted, or distance
  caloriesBurned: number;
  rpe: number | null; // 1–10
  completed: boolean;
}

export interface SleepSession {
  id: string;
  bedTime: string; // ISO
  wakeTime: string; // ISO
  durationMinutes: number;
  quality: number; // 0–100 self-rated
}

export interface HydrationLog {
  id: string;
  time: string; // ISO
  amountMl: number;
  source: HydrationSource;
}

export interface NutritionLog {
  id: string;
  meal: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // ISO
}

export interface BodyMeasurement {
  id: string;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  waist: number | null;
  recordedAt: string; // ISO
}

// --- derived analytics ---
export interface SleepAnalysis {
  durationMinutes: number;
  score: number; // 0–100
  debtMinutes: number; // vs ideal, cumulative over window
  rollingAverageMinutes: number;
  bedtimeVarianceMinutes: number;
  wakeVarianceMinutes: number;
  consistency: number; // 0–100
}

export interface HydrationSummary {
  totalMl: number;
  goalMl: number;
  remainingMl: number;
  completionPercent: number;
  longestGapMinutes: number;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  caloriesRemaining: number;
  proteinRemaining: number;
  macroSplit: { protein: number; carbs: number; fat: number }; // percentages
}

export interface WorkoutSummary {
  count: number;
  totalMinutes: number;
  totalVolume: number;
  caloriesBurned: number;
  averageRpe: number | null;
}

export interface RecoveryResult {
  status: RecoveryStatus;
  score: number; // 0–100 (higher = more recovered)
  reasons: string[];
}

export interface ReadinessResult {
  score: number; // 0–100
  band: "high" | "moderate" | "low" | "very_low";
  inputs: { sleep: number; recovery: number; hydration: number; energy: number };
  recommendation: string;
}

export interface EnergyResult {
  level: EnergyLevel;
  score: number; // 0–100
  source: "logged" | "derived";
}

export interface Correlation {
  a: string;
  b: string;
  coefficient: number; // -1..1 (Pearson)
  strength: "none" | "weak" | "moderate" | "strong";
  samples: number;
}

export interface HealthSummary {
  date: string;
  sleep: SleepAnalysis | null;
  recovery: RecoveryResult;
  readiness: ReadinessResult;
  hydration: HydrationSummary;
  nutrition: NutritionSummary;
  workouts: WorkoutSummary;
  energy: EnergyResult;
  weight: number | null;
}

/** Deterministic signals exposed to Decision / Planner / Morning. */
export interface HealthSignals {
  readiness: number;
  recovery: RecoveryStatus;
  sleepMinutes: number;
  energy: EnergyLevel;
  hydrationPercent: number;
  lowSleep: boolean;
  highReadiness: boolean;
  nextWorkoutType: WorkoutType | null;
}
