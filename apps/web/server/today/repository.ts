import "server-only";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  dailyFocus,
  dailyMetrics,
  dailyNotes,
  dailyState,
  decisionHistory,
  type DailyFocusRow,
  type DailyMetricsRow,
  type DailyNoteRow,
  type DailyStateRow,
  type DecisionHistoryRow,
} from "@myos/db/schema";

/**
 * Today persistence (Sprint 2.1). Pure DB access over the five today_* tables.
 * No business logic — the service composes these with the core planner.
 */
type Patch<Row, Omitted extends keyof Row> = {
  [K in Exclude<keyof Row, Omitted>]?: Row[K] | undefined;
};

export type StatePatch = Patch<DailyStateRow, "date" | "createdAt">;
export type FocusPatch = Patch<DailyFocusRow, "date" | "createdAt">;
export type MetricsPatch = Patch<DailyMetricsRow, "date" | "createdAt">;

/** Ensure the anchor row for a date exists (idempotent). */
export async function ensureDay(db: Database, date: string): Promise<void> {
  await db.insert(dailyState).values({ date }).onConflictDoNothing();
}

export async function getState(db: Database, date: string): Promise<DailyStateRow | undefined> {
  const [row] = await db.select().from(dailyState).where(eq(dailyState.date, date)).limit(1);
  return row;
}

export async function upsertState(
  db: Database,
  date: string,
  patch: StatePatch,
): Promise<DailyStateRow> {
  const [row] = await db
    .insert(dailyState)
    .values({ date, ...patch })
    .onConflictDoUpdate({ target: dailyState.date, set: { ...patch, updatedAt: new Date() } })
    .returning();
  if (!row) throw new Error("Failed to upsert daily_state");
  return row;
}

export async function getFocus(db: Database, date: string): Promise<DailyFocusRow | undefined> {
  const [row] = await db.select().from(dailyFocus).where(eq(dailyFocus.date, date)).limit(1);
  return row;
}

export async function upsertFocus(
  db: Database,
  date: string,
  patch: FocusPatch,
): Promise<DailyFocusRow> {
  const [row] = await db
    .insert(dailyFocus)
    .values({ date, ...patch })
    .onConflictDoUpdate({ target: dailyFocus.date, set: { ...patch, updatedAt: new Date() } })
    .returning();
  if (!row) throw new Error("Failed to upsert daily_focus");
  return row;
}

export async function getMetrics(db: Database, date: string): Promise<DailyMetricsRow | undefined> {
  const [row] = await db.select().from(dailyMetrics).where(eq(dailyMetrics.date, date)).limit(1);
  return row;
}

export async function upsertMetrics(
  db: Database,
  date: string,
  patch: MetricsPatch,
): Promise<DailyMetricsRow> {
  const [row] = await db
    .insert(dailyMetrics)
    .values({ date, ...patch })
    .onConflictDoUpdate({ target: dailyMetrics.date, set: { ...patch, updatedAt: new Date() } })
    .returning();
  if (!row) throw new Error("Failed to upsert daily_metrics");
  return row;
}

export async function addNote(
  db: Database,
  input: { date: string; content: string; type: DailyNoteRow["type"] },
): Promise<DailyNoteRow> {
  const [row] = await db.insert(dailyNotes).values(input).returning();
  if (!row) throw new Error("Failed to insert daily_note");
  return row;
}

export async function listNotes(db: Database, date: string): Promise<DailyNoteRow[]> {
  return db
    .select()
    .from(dailyNotes)
    .where(eq(dailyNotes.date, date))
    .orderBy(desc(dailyNotes.timestamp));
}

export async function listDecisions(
  db: Database,
  date: string | undefined,
  limit: number,
): Promise<DecisionHistoryRow[]> {
  const base = db.select().from(decisionHistory);
  const scoped = date ? base.where(eq(decisionHistory.date, date)) : base;
  return scoped.orderBy(desc(decisionHistory.timestamp)).limit(limit);
}

export async function addDecision(
  db: Database,
  input: {
    date: string;
    decision: string;
    reason?: string | null;
    confidence?: number | null;
  },
): Promise<DecisionHistoryRow> {
  const [row] = await db
    .insert(decisionHistory)
    .values({
      date: input.date,
      decision: input.decision,
      reason: input.reason ?? null,
      confidence: input.confidence ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to insert decision_history");
  return row;
}

/** Find an existing decision for a day by its exact text (for dedup). */
export async function findDecisionByText(
  db: Database,
  date: string,
  decision: string,
): Promise<DecisionHistoryRow | undefined> {
  const [row] = await db
    .select()
    .from(decisionHistory)
    .where(and(eq(decisionHistory.date, date), eq(decisionHistory.decision, decision)))
    .limit(1);
  return row;
}

/** Count still-pending (not accepted, not dismissed) decisions for a day. */
export async function countPendingDecisions(db: Database, date: string): Promise<number> {
  const rows = await db
    .select({ id: decisionHistory.id })
    .from(decisionHistory)
    .where(
      and(
        eq(decisionHistory.date, date),
        eq(decisionHistory.accepted, false),
        eq(decisionHistory.dismissed, false),
      ),
    );
  return rows.length;
}

export async function countNotes(db: Database, date: string): Promise<number> {
  const rows = await db
    .select({ id: dailyNotes.id })
    .from(dailyNotes)
    .where(eq(dailyNotes.date, date));
  return rows.length;
}
