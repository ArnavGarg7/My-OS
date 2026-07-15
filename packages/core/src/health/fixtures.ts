import type {
  BodyMeasurement,
  HealthDaily,
  HydrationLog,
  NutritionLog,
  SleepSession,
  Workout,
} from "./types";

/** Test fixtures for the health engine (imported by *.test.ts). */
export const at = (h: number, m = 0, day = 7) =>
  new Date(Date.UTC(2026, 6, day, h, m, 0)).toISOString();

export function makeDaily(over: Partial<HealthDaily> = {}): HealthDaily {
  return {
    date: "2026-07-07",
    energyLevel: null,
    mood: null,
    stress: null,
    waterMl: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    steps: 0,
    weight: null,
    bodyFat: null,
    notes: "",
    ...over,
  };
}

export function makeSleep(over: Partial<SleepSession> = {}): SleepSession {
  const bedTime = over.bedTime ?? at(23, 0, 6);
  const wakeTime = over.wakeTime ?? at(7, 0, 7);
  const durationMinutes =
    over.durationMinutes ??
    Math.max(0, Math.round((new Date(wakeTime).getTime() - new Date(bedTime).getTime()) / 60000));
  return {
    id: over.id ?? "s1",
    bedTime,
    wakeTime,
    durationMinutes,
    quality: over.quality ?? 75,
  };
}

export function makeWorkout(over: Partial<Workout> = {}): Workout {
  return {
    id: over.id ?? "w1",
    type: over.type ?? "strength",
    startedAt: over.startedAt ?? at(17, 0),
    endedAt: over.endedAt ?? at(18, 0),
    durationMinutes: over.durationMinutes ?? 60,
    volume: over.volume ?? 5000,
    caloriesBurned: over.caloriesBurned ?? 360,
    rpe: over.rpe ?? 7,
    completed: over.completed ?? true,
  };
}

export function makeHydration(over: Partial<HydrationLog> = {}): HydrationLog {
  return {
    id: over.id ?? "h1",
    time: over.time ?? at(9, 0),
    amountMl: over.amountMl ?? 500,
    source: over.source ?? "water",
  };
}

export function makeNutrition(over: Partial<NutritionLog> = {}): NutritionLog {
  return {
    id: over.id ?? "n1",
    meal: over.meal ?? "lunch",
    calories: over.calories ?? 600,
    protein: over.protein ?? 40,
    carbs: over.carbs ?? 60,
    fat: over.fat ?? 20,
    loggedAt: over.loggedAt ?? at(13, 0),
  };
}

export function makeBody(over: Partial<BodyMeasurement> = {}): BodyMeasurement {
  return {
    id: over.id ?? "b1",
    weight: "weight" in over ? (over.weight ?? null) : 75,
    bodyFat: "bodyFat" in over ? (over.bodyFat ?? null) : 18,
    muscleMass: "muscleMass" in over ? (over.muscleMass ?? null) : 35,
    waist: "waist" in over ? (over.waist ?? null) : 82,
    recordedAt: over.recordedAt ?? at(7, 0),
  };
}
