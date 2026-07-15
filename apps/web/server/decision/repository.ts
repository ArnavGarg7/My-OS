import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import { decisionHistory, type DecisionHistoryRow } from "@myos/db/schema";
import { decisionToColumns } from "./mapper";
import type { Decision } from "@myos/core/decision";

/**
 * Decision persistence (Sprint 2.3). Pure DB access over decision_history. No
 * business logic — the service composes these with the core engine.
 */
export async function listByDate(db: Database, date: string): Promise<DecisionHistoryRow[]> {
  return db
    .select()
    .from(decisionHistory)
    .where(eq(decisionHistory.date, date))
    .orderBy(desc(decisionHistory.createdAt));
}

export async function list(
  db: Database,
  date: string | undefined,
  limit: number,
): Promise<DecisionHistoryRow[]> {
  const base = db.select().from(decisionHistory);
  const scoped = date ? base.where(eq(decisionHistory.date, date)) : base;
  return scoped.orderBy(desc(decisionHistory.createdAt)).limit(limit);
}

export async function getById(db: Database, id: string): Promise<DecisionHistoryRow | undefined> {
  const [row] = await db.select().from(decisionHistory).where(eq(decisionHistory.id, id)).limit(1);
  return row;
}

export async function insertDecision(
  db: Database,
  date: string,
  decision: Decision,
): Promise<DecisionHistoryRow> {
  const [row] = await db
    .insert(decisionHistory)
    .values({ date, ...decisionToColumns(decision) })
    .returning();
  if (!row) throw new Error("Failed to insert decision");
  return row;
}

export async function updateDecision(
  db: Database,
  id: string,
  decision: Decision,
): Promise<DecisionHistoryRow> {
  const [row] = await db
    .update(decisionHistory)
    .set(decisionToColumns(decision))
    .where(eq(decisionHistory.id, id))
    .returning();
  if (!row) throw new Error("Failed to update decision");
  return row;
}
