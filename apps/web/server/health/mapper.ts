import "server-only";
import type {
  BodyMeasurement,
  HealthDaily,
  HydrationLog,
  NutritionLog,
  SleepSession,
  Workout,
} from "@myos/core/health";
import type {
  BodyMeasurementRow,
  HealthDailyRow,
  HydrationLogRow,
  NutritionLogRow,
  SleepSessionRow,
  WorkoutRow,
} from "@myos/db/schema";
import type { EnergyLevel, HydrationSource, MealType, Mood, WorkoutType } from "@myos/core/health";

/**
 * Health row ↔ DTO mapping (Sprint 2.9). Timestamps become ISO strings for the
 * pure engine + client. Derived analytics are never persisted, so there is no
 * reverse mapping for them.
 */
export function dailyRowToDaily(row: HealthDailyRow): HealthDaily {
  return {
    date: row.date,
    energyLevel: (row.energyLevel as EnergyLevel | null) ?? null,
    mood: (row.mood as Mood | null) ?? null,
    stress: row.stress,
    waterMl: row.waterMl,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    steps: row.steps,
    weight: row.weight,
    bodyFat: row.bodyFat,
    notes: row.notes,
  };
}

export function workoutRowToWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    type: row.type as WorkoutType,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    durationMinutes: row.durationMinutes,
    volume: row.volume,
    caloriesBurned: row.caloriesBurned,
    rpe: row.rpe,
    completed: row.completed,
  };
}

export function sleepRowToSleep(row: SleepSessionRow): SleepSession {
  return {
    id: row.id,
    bedTime: row.bedTime.toISOString(),
    wakeTime: row.wakeTime.toISOString(),
    durationMinutes: row.durationMinutes,
    quality: row.quality,
  };
}

export function hydrationRowToLog(row: HydrationLogRow): HydrationLog {
  return {
    id: row.id,
    time: row.time.toISOString(),
    amountMl: row.amountMl,
    source: row.source as HydrationSource,
  };
}

export function nutritionRowToLog(row: NutritionLogRow): NutritionLog {
  return {
    id: row.id,
    meal: row.meal as MealType,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    loggedAt: row.loggedAt.toISOString(),
  };
}

export function bodyRowToMeasurement(row: BodyMeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    weight: row.weight,
    bodyFat: row.bodyFat,
    muscleMass: row.muscleMass,
    waist: row.waist,
    recordedAt: row.recordedAt.toISOString(),
  };
}
