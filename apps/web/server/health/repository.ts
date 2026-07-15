import "server-only";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  bodyMeasurements,
  healthDaily,
  hydrationLogs,
  nutritionLogs,
  sleepSessions,
  workouts,
  type BodyMeasurementRow,
  type HealthDailyInsert,
  type HealthDailyRow,
  type HydrationLogRow,
  type NutritionLogRow,
  type SleepSessionRow,
  type WorkoutRow,
} from "@myos/db/schema";

/**
 * Health persistence (Sprint 2.9). Pure DB access over the six health tables.
 * No business logic — the service composes these with the pure HealthEngine.
 * Timestamps are Date objects at the DB boundary; the mapper ISO-encodes them.
 */
function dayBounds(date: string): { from: Date; to: Date } {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 24 * 60 * 60_000);
  return { from, to };
}

// --- daily ---
export async function getDaily(db: Database, date: string): Promise<HealthDailyRow | undefined> {
  const [row] = await db.select().from(healthDaily).where(eq(healthDaily.date, date)).limit(1);
  return row;
}

export async function upsertDaily(
  db: Database,
  date: string,
  patch: Partial<HealthDailyInsert>,
): Promise<HealthDailyRow> {
  const [row] = await db
    .insert(healthDaily)
    .values({ date, ...patch })
    .onConflictDoUpdate({ target: healthDaily.date, set: patch })
    .returning();
  if (!row) throw new Error("Failed to upsert health daily");
  return row;
}

export function listDaily(db: Database, from: string, to: string): Promise<HealthDailyRow[]> {
  return db
    .select()
    .from(healthDaily)
    .where(and(gte(healthDaily.date, from), lte(healthDaily.date, to)))
    .orderBy(healthDaily.date);
}

// --- workouts ---
export function listWorkouts(db: Database, range?: { date?: string }): Promise<WorkoutRow[]> {
  if (range?.date) {
    const { from, to } = dayBounds(range.date);
    return db
      .select()
      .from(workouts)
      .where(and(gte(workouts.startedAt, from), lte(workouts.startedAt, to)))
      .orderBy(desc(workouts.startedAt));
  }
  return db.select().from(workouts).orderBy(desc(workouts.startedAt)).limit(200);
}

export function recentWorkouts(db: Database, since: Date): Promise<WorkoutRow[]> {
  return db
    .select()
    .from(workouts)
    .where(gte(workouts.startedAt, since))
    .orderBy(desc(workouts.startedAt));
}

export async function getWorkout(db: Database, id: string): Promise<WorkoutRow | undefined> {
  const [row] = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
  return row;
}

export async function insertWorkout(
  db: Database,
  values: {
    type: WorkoutRow["type"];
    startedAt: Date;
    endedAt: Date | null;
    durationMinutes: number;
    volume: number;
    caloriesBurned: number;
    rpe: number | null;
    completed: boolean;
  },
): Promise<WorkoutRow> {
  const [row] = await db.insert(workouts).values(values).returning();
  if (!row) throw new Error("Failed to insert workout");
  return row;
}

export async function updateWorkout(
  db: Database,
  id: string,
  patch: Partial<WorkoutRow>,
): Promise<WorkoutRow> {
  const [row] = await db.update(workouts).set(patch).where(eq(workouts.id, id)).returning();
  if (!row) throw new Error("Workout not found");
  return row;
}

// --- sleep ---
export function listSleep(db: Database, limit = 30): Promise<SleepSessionRow[]> {
  return db.select().from(sleepSessions).orderBy(desc(sleepSessions.wakeTime)).limit(limit);
}

export async function insertSleep(
  db: Database,
  values: { bedTime: Date; wakeTime: Date; durationMinutes: number; quality: number },
): Promise<SleepSessionRow> {
  const [row] = await db.insert(sleepSessions).values(values).returning();
  if (!row) throw new Error("Failed to insert sleep session");
  return row;
}

// --- hydration ---
export function listHydration(db: Database, date: string): Promise<HydrationLogRow[]> {
  const { from, to } = dayBounds(date);
  return db
    .select()
    .from(hydrationLogs)
    .where(and(gte(hydrationLogs.time, from), lte(hydrationLogs.time, to)))
    .orderBy(hydrationLogs.time);
}

export async function insertHydration(
  db: Database,
  values: { time: Date; amountMl: number; source: string },
): Promise<HydrationLogRow> {
  const [row] = await db.insert(hydrationLogs).values(values).returning();
  if (!row) throw new Error("Failed to insert hydration log");
  return row;
}

// --- nutrition ---
export function listNutrition(db: Database, date: string): Promise<NutritionLogRow[]> {
  const { from, to } = dayBounds(date);
  return db
    .select()
    .from(nutritionLogs)
    .where(and(gte(nutritionLogs.loggedAt, from), lte(nutritionLogs.loggedAt, to)))
    .orderBy(nutritionLogs.loggedAt);
}

export async function insertNutrition(
  db: Database,
  values: {
    meal: NutritionLogRow["meal"];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    loggedAt: Date;
  },
): Promise<NutritionLogRow> {
  const [row] = await db.insert(nutritionLogs).values(values).returning();
  if (!row) throw new Error("Failed to insert nutrition log");
  return row;
}

// --- body ---
export function listBody(db: Database, limit = 60): Promise<BodyMeasurementRow[]> {
  return db.select().from(bodyMeasurements).orderBy(desc(bodyMeasurements.recordedAt)).limit(limit);
}

export async function insertBody(
  db: Database,
  values: {
    weight: number | null;
    bodyFat: number | null;
    muscleMass: number | null;
    waist: number | null;
    recordedAt: Date;
  },
): Promise<BodyMeasurementRow> {
  const [row] = await db.insert(bodyMeasurements).values(values).returning();
  if (!row) throw new Error("Failed to insert body measurement");
  return row;
}
