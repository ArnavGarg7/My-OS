import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  bodyMeasurements,
  healthDaily,
  hydrationLogs,
  nutritionGoals,
  nutritionLogs,
  type BodyMeasurementInsert,
  type NutritionGoalRow,
  type NutritionLogInsert,
  type NutritionLogRow,
} from "@myos/db/schema";

/**
 * Nutrition persistence (Nutrition module). Reuses the existing Health tables — nutrition_logs (extended
 * with food identity/portion/planned), hydration_logs (water), body_measurements (weight), health_daily
 * (the day rollup), plus the new nutrition_goals. No business logic here.
 */

// ── Food logs ───────────────────────────────────────────────────────────────
export function listLogsForDay(db: Database, date: string): Promise<NutritionLogRow[]> {
  return db
    .select()
    .from(nutritionLogs)
    .where(eq(nutritionLogs.consumedOn, date))
    .orderBy(nutritionLogs.loggedAt);
}
export async function insertLog(db: Database, v: NutritionLogInsert): Promise<NutritionLogRow> {
  const [row] = await db.insert(nutritionLogs).values(v).returning();
  if (!row) throw new Error("Failed to insert nutrition log");
  return row;
}
/** Delete a log, returning the day it belonged to so the rollup can be recomputed. */
export async function deleteLog(db: Database, id: string): Promise<string | null> {
  const [row] = await db
    .delete(nutritionLogs)
    .where(eq(nutritionLogs.id, id))
    .returning({ consumedOn: nutritionLogs.consumedOn });
  return row?.consumedOn ?? null;
}

// ── Water ─────────────────────────────────────────────────────────────────────
export async function insertHydration(
  db: Database,
  amountMl: number,
  source: string,
): Promise<void> {
  await db.insert(hydrationLogs).values({ amountMl, source });
}

// ── Weight / body ──────────────────────────────────────────────────────────────
export async function insertBodyMeasurement(db: Database, v: BodyMeasurementInsert): Promise<void> {
  await db.insert(bodyMeasurements).values(v);
}
export async function latestBodyMeasurement(db: Database) {
  const [row] = await db
    .select()
    .from(bodyMeasurements)
    .orderBy(desc(bodyMeasurements.recordedAt))
    .limit(1);
  return row;
}
export async function recentWeights(db: Database, limit = 30) {
  return db
    .select({ weight: bodyMeasurements.weight, recordedAt: bodyMeasurements.recordedAt })
    .from(bodyMeasurements)
    .where(sql`${bodyMeasurements.weight} is not null`)
    .orderBy(desc(bodyMeasurements.recordedAt))
    .limit(limit);
}

// ── Goals (single active row) ────────────────────────────────────────────────────
export async function getActiveGoals(db: Database): Promise<NutritionGoalRow | undefined> {
  const [row] = await db
    .select()
    .from(nutritionGoals)
    .where(eq(nutritionGoals.active, true))
    .orderBy(desc(nutritionGoals.updatedAt))
    .limit(1);
  return row;
}
export async function upsertGoals(
  db: Database,
  patch: Partial<NutritionGoalRow>,
): Promise<NutritionGoalRow> {
  const existing = await getActiveGoals(db);
  if (existing) {
    const [row] = await db
      .update(nutritionGoals)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(nutritionGoals.id, existing.id))
      .returning();
    return row!;
  }
  const [row] = await db
    .insert(nutritionGoals)
    .values({ ...patch })
    .returning();
  return row!;
}

// ── Day rollup (health_daily) ────────────────────────────────────────────────────
/** Read the denormalized day row (water + cached macros), if present. */
export async function getDaily(db: Database, date: string) {
  const [row] = await db.select().from(healthDaily).where(eq(healthDaily.date, date)).limit(1);
  return row;
}
/** Add water to the day rollup (upsert). */
export async function addWaterToDaily(db: Database, date: string, amountMl: number): Promise<void> {
  await db
    .insert(healthDaily)
    .values({ date, waterMl: amountMl })
    .onConflictDoUpdate({
      target: healthDaily.date,
      set: { waterMl: sql`${healthDaily.waterMl} + ${amountMl}` },
    });
}
/** Recompute the day's macro rollup from the ACTUAL food logs (planned excluded). */
export async function recomputeDailyMacros(db: Database, date: string): Promise<void> {
  const [agg] = await db
    .select({
      calories: sql<number>`coalesce(sum(${nutritionLogs.calories}), 0)`,
      protein: sql<number>`coalesce(sum(${nutritionLogs.protein}), 0)`,
      carbs: sql<number>`coalesce(sum(${nutritionLogs.carbs}), 0)`,
      fat: sql<number>`coalesce(sum(${nutritionLogs.fat}), 0)`,
    })
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.consumedOn, date), eq(nutritionLogs.planned, false)));
  const calories = Math.round(Number(agg?.calories ?? 0));
  const protein = Number(agg?.protein ?? 0);
  const carbs = Number(agg?.carbs ?? 0);
  const fat = Number(agg?.fat ?? 0);
  await db
    .insert(healthDaily)
    .values({ date, calories, protein, carbs, fat })
    .onConflictDoUpdate({ target: healthDaily.date, set: { calories, protein, carbs, fat } });
}
/** Set the day's weight on the rollup (upsert). */
export async function setDailyWeight(db: Database, date: string, weight: number): Promise<void> {
  await db
    .insert(healthDaily)
    .values({ date, weight })
    .onConflictDoUpdate({ target: healthDaily.date, set: { weight } });
}
