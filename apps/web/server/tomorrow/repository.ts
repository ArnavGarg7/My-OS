import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  tomorrowChecklist,
  tomorrowPlans,
  tomorrowPriorities,
  tomorrowReviews,
  type TomorrowChecklistRow,
  type TomorrowPlanInsert,
  type TomorrowPlanRow,
  type TomorrowPriorityRow,
  type TomorrowReviewRow,
} from "@myos/db/schema";

/**
 * Tomorrow persistence (Sprint 3.1). Stores the plan header, chosen priorities,
 * checklist and evening review. One plan per planning date (upsert). Priorities +
 * checklist are replace-on-save (the studio is the single editor).
 */
export async function getPlan(
  db: Database,
  planningDate: string,
): Promise<TomorrowPlanRow | undefined> {
  const [row] = await db
    .select()
    .from(tomorrowPlans)
    .where(eq(tomorrowPlans.planningDate, planningDate))
    .limit(1);
  return row;
}

export async function upsertPlan(
  db: Database,
  values: TomorrowPlanInsert,
): Promise<TomorrowPlanRow> {
  const [row] = await db
    .insert(tomorrowPlans)
    .values(values)
    .onConflictDoUpdate({
      target: tomorrowPlans.planningDate,
      set: { targetDate: values.targetDate, updatedAt: new Date() },
    })
    .returning();
  if (!row) throw new Error("Failed to upsert tomorrow plan");
  return row;
}

export async function setPlanStatus(
  db: Database,
  id: string,
  status: TomorrowPlanRow["status"],
  completed: boolean,
): Promise<TomorrowPlanRow> {
  const [row] = await db
    .update(tomorrowPlans)
    .set({ status, completed, updatedAt: new Date() })
    .where(eq(tomorrowPlans.id, id))
    .returning();
  if (!row) throw new Error("Tomorrow plan not found");
  return row;
}

// --- priorities (replace-on-save) ---
export function listPriorities(db: Database, planId: string): Promise<TomorrowPriorityRow[]> {
  return db
    .select()
    .from(tomorrowPriorities)
    .where(eq(tomorrowPriorities.planId, planId))
    .orderBy(tomorrowPriorities.priorityOrder);
}

export async function replacePriorities(
  db: Database,
  planId: string,
  rows: {
    priorityOrder: number;
    taskId: string | null;
    projectId: string | null;
    goalId: string | null;
    title: string;
  }[],
): Promise<TomorrowPriorityRow[]> {
  await db.delete(tomorrowPriorities).where(eq(tomorrowPriorities.planId, planId));
  if (rows.length === 0) return [];
  return db
    .insert(tomorrowPriorities)
    .values(rows.map((r) => ({ ...r, planId })))
    .returning();
}

// --- checklist ---
export function listChecklist(db: Database, planId: string): Promise<TomorrowChecklistRow[]> {
  return db.select().from(tomorrowChecklist).where(eq(tomorrowChecklist.planId, planId));
}

export async function seedChecklist(
  db: Database,
  planId: string,
  items: { item: string; required: boolean }[],
): Promise<TomorrowChecklistRow[]> {
  const existing = await listChecklist(db, planId);
  if (existing.length > 0) return existing;
  return db
    .insert(tomorrowChecklist)
    .values(items.map((i) => ({ planId, item: i.item, required: i.required, completed: false })))
    .returning();
}

export async function setChecklistItem(
  db: Database,
  id: string,
  completed: boolean,
): Promise<TomorrowChecklistRow> {
  const [row] = await db
    .update(tomorrowChecklist)
    .set({ completed })
    .where(eq(tomorrowChecklist.id, id))
    .returning();
  if (!row) throw new Error("Checklist item not found");
  return row;
}

// --- reviews ---
export async function upsertReview(
  db: Database,
  values: {
    planningDate: string;
    completionScore: number;
    plannerAccuracy: number;
    deepWork: number;
    unfinishedTasks: number;
    summary: string;
  },
): Promise<TomorrowReviewRow> {
  const [row] = await db
    .insert(tomorrowReviews)
    .values(values)
    .onConflictDoUpdate({ target: tomorrowReviews.planningDate, set: values })
    .returning();
  if (!row) throw new Error("Failed to upsert review");
  return row;
}

export function recentReviews(db: Database, limit = 14): Promise<TomorrowReviewRow[]> {
  return db.select().from(tomorrowReviews).orderBy(desc(tomorrowReviews.planningDate)).limit(limit);
}
