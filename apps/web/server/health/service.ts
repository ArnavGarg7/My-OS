import "server-only";
import {
  bodyFatTrend,
  estimateCalories,
  standardCorrelations,
  weightTrend,
  type BodyMeasurement,
  type Correlation,
  type EnergyLevel,
  type HealthDaily,
  type HealthSummary,
  type HydrationLog,
  type Mood,
  type NutritionLog,
  type SleepSession,
  type Workout,
} from "@myos/core/health";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import type {
  LogMealInput,
  LogSleepInput,
  LogWaterInput,
  LogWorkoutInput,
  UpdateWeightInput,
} from "@myos/core/health";
import * as repo from "./repository";
import {
  bodyRowToMeasurement,
  dailyRowToDaily,
  hydrationRowToLog,
  nutritionRowToLog,
  sleepRowToSleep,
  workoutRowToWorkout,
} from "./mapper";
import { buildSignals, buildSummary } from "./summary";

/**
 * HealthService (Sprint 2.9). Bridges the pure HealthEngine with persistence.
 * Log mutations append to the relevant table and keep the denormalized
 * `health_daily` aggregates in sync; reads recompute derived analytics.
 */
function dateFor(tz: string, date?: string): string {
  return date ?? todayInTimeZone(tz);
}

// --- reads ---
export function summary(db: Database, tz: string, date?: string): Promise<HealthSummary> {
  return buildSummary(db, dateFor(tz, date));
}

export function signals(db: Database, tz: string, date?: string) {
  return buildSignals(db, dateFor(tz, date));
}

export async function daily(db: Database, tz: string, date?: string): Promise<HealthDaily | null> {
  const row = await repo.getDaily(db, dateFor(tz, date));
  return row ? dailyRowToDaily(row) : null;
}

export async function sleep(db: Database): Promise<SleepSession[]> {
  return (await repo.listSleep(db, 30)).map(sleepRowToSleep);
}

export async function workoutList(db: Database, tz: string, date?: string): Promise<Workout[]> {
  return (await repo.listWorkouts(db, { date: dateFor(tz, date) })).map(workoutRowToWorkout);
}

export async function hydration(db: Database, tz: string, date?: string): Promise<HydrationLog[]> {
  return (await repo.listHydration(db, dateFor(tz, date))).map(hydrationRowToLog);
}

export async function nutrition(db: Database, tz: string, date?: string): Promise<NutritionLog[]> {
  return (await repo.listNutrition(db, dateFor(tz, date))).map(nutritionRowToLog);
}

export async function body(db: Database): Promise<BodyMeasurement[]> {
  return (await repo.listBody(db, 60)).map(bodyRowToMeasurement);
}

export async function readiness(db: Database, tz: string, date?: string) {
  return (await summary(db, tz, date)).readiness;
}

export async function energy(db: Database, tz: string, date?: string) {
  return (await summary(db, tz, date)).energy;
}

export async function recovery(db: Database, tz: string, date?: string) {
  return (await summary(db, tz, date)).recovery;
}

export async function trends(
  db: Database,
  days = 30,
): Promise<{
  weight: ReturnType<typeof weightTrend>;
  bodyFat: ReturnType<typeof bodyFatTrend>;
  correlations: Correlation[];
}> {
  const measurements = (await repo.listBody(db, days)).map(bodyRowToMeasurement);
  const today = todayInTimeZone("UTC");
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const dailies = (await repo.listDaily(db, from, today)).map(dailyRowToDaily);
  const sessions = (await repo.listSleep(db, days)).map(sleepRowToSleep);
  return {
    weight: weightTrend(measurements),
    bodyFat: bodyFatTrend(measurements),
    correlations: standardCorrelations(dailies, sessions),
  };
}

export async function history(db: Database, days = 14): Promise<HealthDaily[]> {
  const today = todayInTimeZone("UTC");
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return (await repo.listDaily(db, from, today)).map(dailyRowToDaily);
}

// --- aggregate sync ---
async function syncDailyAggregates(db: Database, tz: string, date: string): Promise<void> {
  const [hy, nu] = await Promise.all([repo.listHydration(db, date), repo.listNutrition(db, date)]);
  const waterMl = hy.filter((h) => h.source === "water").reduce((s, h) => s + h.amountMl, 0);
  const calories = nu.reduce((s, n) => s + n.calories, 0);
  const protein = nu.reduce((s, n) => s + n.protein, 0);
  const carbs = nu.reduce((s, n) => s + n.carbs, 0);
  const fat = nu.reduce((s, n) => s + n.fat, 0);
  const s = await buildSummary(db, date);
  await repo.upsertDaily(db, date, {
    waterMl,
    calories,
    protein,
    carbs,
    fat,
    sleepScore: s.sleep?.score ?? null,
    readinessScore: s.readiness.score,
  });
}

// --- writes ---
export async function logWater(
  db: Database,
  tz: string,
  input: LogWaterInput,
): Promise<HydrationLog> {
  const time = input.time ? new Date(input.time) : new Date();
  const row = await repo.insertHydration(db, {
    time,
    amountMl: input.amountMl,
    source: input.source,
  });
  await syncDailyAggregates(db, tz, dateFor(tz, time.toISOString().slice(0, 10)));
  return hydrationRowToLog(row);
}

export async function logMeal(
  db: Database,
  tz: string,
  input: LogMealInput,
): Promise<NutritionLog> {
  const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();
  const row = await repo.insertNutrition(db, {
    meal: input.meal,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    loggedAt,
  });
  await syncDailyAggregates(db, tz, loggedAt.toISOString().slice(0, 10));
  return nutritionRowToLog(row);
}

export async function logWorkout(
  db: Database,
  tz: string,
  input: LogWorkoutInput,
): Promise<Workout> {
  const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
  const endedAt = input.completed
    ? new Date(startedAt.getTime() + input.durationMinutes * 60_000)
    : null;
  const row = await repo.insertWorkout(db, {
    type: input.type,
    startedAt,
    endedAt,
    durationMinutes: input.durationMinutes,
    volume: input.volume,
    caloriesBurned: estimateCalories(input.type, input.durationMinutes, input.rpe),
    rpe: input.rpe,
    completed: input.completed,
  });
  await syncDailyAggregates(db, tz, dateFor(tz));
  return workoutRowToWorkout(row);
}

export async function finishWorkout(
  db: Database,
  tz: string,
  id: string,
  endedAt?: string,
): Promise<Workout> {
  const row = await repo.getWorkout(db, id);
  if (!row) throw new Error("Workout not found");
  const end = endedAt ? new Date(endedAt) : new Date();
  const duration =
    row.durationMinutes > 0
      ? row.durationMinutes
      : Math.max(0, Math.round((end.getTime() - row.startedAt.getTime()) / 60_000));
  const updated = await repo.updateWorkout(db, id, {
    endedAt: end,
    durationMinutes: duration,
    completed: true,
    caloriesBurned: row.caloriesBurned || estimateCalories(row.type, duration, row.rpe),
  });
  await syncDailyAggregates(db, tz, dateFor(tz));
  return workoutRowToWorkout(updated);
}

export async function logSleep(
  db: Database,
  tz: string,
  input: LogSleepInput,
): Promise<SleepSession> {
  const bed = new Date(input.bedTime);
  const wake = new Date(input.wakeTime);
  const durationMinutes = Math.max(0, Math.round((wake.getTime() - bed.getTime()) / 60_000));
  const row = await repo.insertSleep(db, {
    bedTime: bed,
    wakeTime: wake,
    durationMinutes,
    quality: input.quality,
  });
  await syncDailyAggregates(db, tz, wake.toISOString().slice(0, 10));
  return sleepRowToSleep(row);
}

export async function updateWeight(
  db: Database,
  tz: string,
  input: UpdateWeightInput,
): Promise<BodyMeasurement> {
  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
  const row = await repo.insertBody(db, {
    weight: input.weight,
    bodyFat: input.bodyFat ?? null,
    muscleMass: input.muscleMass ?? null,
    waist: input.waist ?? null,
    recordedAt,
  });
  await repo.upsertDaily(db, dateFor(tz), { weight: input.weight, bodyFat: input.bodyFat ?? null });
  return bodyRowToMeasurement(row);
}

export async function updateEnergy(
  db: Database,
  tz: string,
  level: EnergyLevel,
  date?: string,
): Promise<HealthDaily> {
  const row = await repo.upsertDaily(db, dateFor(tz, date), { energyLevel: level });
  return dailyRowToDaily(row);
}

export async function updateMood(
  db: Database,
  tz: string,
  mood: Mood,
  stress?: number,
  date?: string,
): Promise<HealthDaily> {
  const row = await repo.upsertDaily(db, dateFor(tz, date), {
    mood,
    ...(stress !== undefined ? { stress } : {}),
  });
  return dailyRowToDaily(row);
}
