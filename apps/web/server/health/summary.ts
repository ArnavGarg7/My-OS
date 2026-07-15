import "server-only";
import {
  healthEngine,
  type HealthInput,
  type HealthSummary,
  type HealthSignals,
} from "@myos/core/health";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import {
  bodyRowToMeasurement,
  dailyRowToDaily,
  hydrationRowToLog,
  nutritionRowToLog,
  sleepRowToSleep,
  workoutRowToWorkout,
} from "./mapper";

/**
 * Health summary/signals assembly (Sprint 2.9). Loads the day's logs + recent
 * history and runs the pure HealthEngine. Nothing derived is stored — every
 * read recomputes sleep score / recovery / readiness deterministically.
 */
const DAY_MS = 86_400_000;

export async function loadInput(
  db: Database,
  date: string,
  now = new Date(),
): Promise<HealthInput> {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const twoDaysAgo = new Date(dayStart.getTime() - 2 * DAY_MS);

  const [dailyRow, sleepRows, workoutRows, recentRows, hydrationRows, nutritionRows, bodyRows] =
    await Promise.all([
      repo.getDaily(db, date),
      repo.listSleep(db, 30),
      repo.listWorkouts(db, { date }),
      repo.recentWorkouts(db, twoDaysAgo),
      repo.listHydration(db, date),
      repo.listNutrition(db, date),
      repo.listBody(db, 60),
    ]);

  const sleepHistory = sleepRows.map(sleepRowToSleep);
  const latestSleep =
    sleepHistory.find((s) => s.wakeTime.slice(0, 10) === date) ?? sleepHistory[0] ?? null;

  return {
    date,
    daily: dailyRow ? dailyRowToDaily(dailyRow) : null,
    latestSleep,
    sleepHistory,
    workouts: workoutRows.map(workoutRowToWorkout),
    recentWorkouts: recentRows.map(workoutRowToWorkout),
    hydration: hydrationRows.map(hydrationRowToLog),
    nutrition: nutritionRows.map(nutritionRowToLog),
    body: bodyRows.map(bodyRowToMeasurement),
    now,
  };
}

export async function buildSummary(
  db: Database,
  date: string,
  now = new Date(),
): Promise<HealthSummary> {
  return healthEngine.summary(await loadInput(db, date, now));
}

export async function buildSignals(
  db: Database,
  date: string,
  now = new Date(),
): Promise<HealthSignals> {
  return healthEngine.signals(await loadInput(db, date, now));
}
