import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  plannerBlocks,
  plannerDays,
  plannerHistory,
  type PlannerBlockRow,
  type PlannerDayRow,
  type PlannerHistoryRow,
} from "@myos/db/schema";
import type { PlannerBlock, PlannerDay } from "@myos/core/planner";
import { blockToColumns, dayToColumns } from "./mapper";

/**
 * Planner persistence (Sprint 2.6). Pure DB access over the three planner tables.
 * No business logic — the service composes these with the pure PlannerEngine.
 */
export async function getDay(db: Database, date: string): Promise<PlannerDayRow | undefined> {
  const [row] = await db.select().from(plannerDays).where(eq(plannerDays.date, date)).limit(1);
  return row;
}

export async function upsertDay(db: Database, day: PlannerDay): Promise<PlannerDayRow> {
  const cols = dayToColumns(day);
  const [row] = await db
    .insert(plannerDays)
    .values({ date: day.date, ...cols })
    .onConflictDoUpdate({ target: plannerDays.date, set: cols })
    .returning();
  if (!row) throw new Error("Failed to upsert planner_day");
  return row;
}

export function listBlocks(db: Database, date: string): Promise<PlannerBlockRow[]> {
  return db
    .select()
    .from(plannerBlocks)
    .where(eq(plannerBlocks.plannerDate, date))
    .orderBy(plannerBlocks.startTime);
}

export async function getBlock(db: Database, id: string): Promise<PlannerBlockRow | undefined> {
  const [row] = await db.select().from(plannerBlocks).where(eq(plannerBlocks.id, id)).limit(1);
  return row;
}

export async function insertBlock(db: Database, block: PlannerBlock): Promise<PlannerBlockRow> {
  const [row] = await db.insert(plannerBlocks).values(blockToColumns(block)).returning();
  if (!row) throw new Error("Failed to insert planner_block");
  return row;
}

export async function updateBlock(
  db: Database,
  id: string,
  block: PlannerBlock,
): Promise<PlannerBlockRow> {
  const [row] = await db
    .update(plannerBlocks)
    .set(blockToColumns(block))
    .where(eq(plannerBlocks.id, id))
    .returning();
  if (!row) throw new Error("Failed to update planner_block");
  return row;
}

/**
 * Remove regenerable blocks (generated + not locked). Locked blocks and manual
 * (non-generated) blocks are preserved across regenerations.
 */
export async function deleteGenerated(db: Database, date: string): Promise<void> {
  await db
    .delete(plannerBlocks)
    .where(
      and(
        eq(plannerBlocks.plannerDate, date),
        eq(plannerBlocks.generated, true),
        ne(plannerBlocks.locked, true),
      ),
    );
}

export async function deleteAllBlocks(db: Database, date: string): Promise<void> {
  await db.delete(plannerBlocks).where(eq(plannerBlocks.plannerDate, date));
}

export async function addHistory(
  db: Database,
  date: string,
  action: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(plannerHistory).values({ plannerDate: date, action, metadata });
}

export function listHistory(
  db: Database,
  date: string,
  limit: number,
): Promise<PlannerHistoryRow[]> {
  return db
    .select()
    .from(plannerHistory)
    .where(eq(plannerHistory.plannerDate, date))
    .orderBy(desc(plannerHistory.createdAt))
    .limit(limit);
}
