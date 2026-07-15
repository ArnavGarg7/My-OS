import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  goalLinks,
  goalObjectives,
  goalReviews,
  goals,
  habits,
  keyResults,
  type GoalInsert,
  type GoalLinkRow,
  type GoalObjectiveRow,
  type GoalReviewRow,
  type GoalRow,
  type HabitRow,
  type KeyResultRow,
} from "@myos/db/schema";

/**
 * Goal persistence (Sprint 2.12). Pure DB access over the six goal tables. No
 * business logic — the service composes these with the pure engine.
 */
export function listGoals(db: Database, status?: GoalRow["status"]): Promise<GoalRow[]> {
  const where = status ? eq(goals.status, status) : undefined;
  return db.select().from(goals).where(where).orderBy(desc(goals.updatedAt));
}

export async function getGoal(db: Database, id: string): Promise<GoalRow | undefined> {
  const [row] = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  return row;
}

export async function insertGoal(db: Database, values: GoalInsert): Promise<GoalRow> {
  const [row] = await db.insert(goals).values(values).returning();
  if (!row) throw new Error("Failed to insert goal");
  return row;
}

export async function updateGoal(
  db: Database,
  id: string,
  patch: Partial<GoalRow>,
): Promise<GoalRow> {
  const [row] = await db.update(goals).set(patch).where(eq(goals.id, id)).returning();
  if (!row) throw new Error("Goal not found");
  return row;
}

// --- objectives + key results ---
export function listObjectives(db: Database, goalIds: string[]): Promise<GoalObjectiveRow[]> {
  if (goalIds.length === 0) return Promise.resolve([]);
  return db.select().from(goalObjectives).where(inArray(goalObjectives.goalId, goalIds));
}

export async function insertObjective(
  db: Database,
  values: { goalId: string; title: string; description: string; weight: number },
): Promise<GoalObjectiveRow> {
  const [row] = await db.insert(goalObjectives).values(values).returning();
  if (!row) throw new Error("Failed to insert objective");
  return row;
}

export async function setObjectiveStatus(
  db: Database,
  id: string,
  status: string,
): Promise<GoalObjectiveRow> {
  const [row] = await db
    .update(goalObjectives)
    .set({ status, updatedAt: new Date() })
    .where(eq(goalObjectives.id, id))
    .returning();
  if (!row) throw new Error("Objective not found");
  return row;
}

export function listKeyResults(db: Database, objectiveIds: string[]): Promise<KeyResultRow[]> {
  if (objectiveIds.length === 0) return Promise.resolve([]);
  return db.select().from(keyResults).where(inArray(keyResults.objectiveId, objectiveIds));
}

export async function getKeyResult(db: Database, id: string): Promise<KeyResultRow | undefined> {
  const [row] = await db.select().from(keyResults).where(eq(keyResults.id, id)).limit(1);
  return row;
}

export async function insertKeyResult(
  db: Database,
  values: {
    objectiveId: string;
    title: string;
    metricType: KeyResultRow["metricType"];
    targetValue: number;
    currentValue: number;
    unit: string;
  },
): Promise<KeyResultRow> {
  const [row] = await db.insert(keyResults).values(values).returning();
  if (!row) throw new Error("Failed to insert key result");
  return row;
}

export async function updateKeyResultRow(
  db: Database,
  id: string,
  patch: { currentValue: number; status: string },
): Promise<KeyResultRow> {
  const [row] = await db.update(keyResults).set(patch).where(eq(keyResults.id, id)).returning();
  if (!row) throw new Error("Key result not found");
  return row;
}

// --- habits ---
export function listHabits(db: Database): Promise<HabitRow[]> {
  return db.select().from(habits).orderBy(habits.title);
}

export async function getHabit(db: Database, id: string): Promise<HabitRow | undefined> {
  const [row] = await db.select().from(habits).where(eq(habits.id, id)).limit(1);
  return row;
}

export async function insertHabit(
  db: Database,
  values: {
    goalId: string | null;
    title: string;
    frequency: HabitRow["frequency"];
    target: number;
  },
): Promise<HabitRow> {
  const [row] = await db.insert(habits).values(values).returning();
  if (!row) throw new Error("Failed to insert habit");
  return row;
}

export async function updateHabitRow(
  db: Database,
  id: string,
  patch: Partial<HabitRow>,
): Promise<HabitRow> {
  const [row] = await db.update(habits).set(patch).where(eq(habits.id, id)).returning();
  if (!row) throw new Error("Habit not found");
  return row;
}

// --- reviews + links ---
export function listReviews(db: Database, goalIds: string[]): Promise<GoalReviewRow[]> {
  if (goalIds.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(goalReviews)
    .where(inArray(goalReviews.goalId, goalIds))
    .orderBy(desc(goalReviews.reviewedAt));
}

export async function insertReview(
  db: Database,
  values: {
    goalId: string;
    reviewPeriod: GoalReviewRow["reviewPeriod"];
    summary: string;
    progressSnapshot: number;
  },
): Promise<GoalReviewRow> {
  const [row] = await db.insert(goalReviews).values(values).returning();
  if (!row) throw new Error("Failed to insert review");
  return row;
}

export function listLinks(db: Database, goalIds: string[]): Promise<GoalLinkRow[]> {
  if (goalIds.length === 0) return Promise.resolve([]);
  return db.select().from(goalLinks).where(inArray(goalLinks.goalId, goalIds));
}

export async function insertLink(
  db: Database,
  values: {
    goalId: string;
    projectId: string | null;
    taskId: string | null;
    journalEntryId: string | null;
    financeGoalId: string | null;
    healthMetric: string | null;
  },
): Promise<GoalLinkRow> {
  const [row] = await db.insert(goalLinks).values(values).returning();
  if (!row) throw new Error("Failed to insert link");
  return row;
}
