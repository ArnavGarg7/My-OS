import "server-only";
import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  focusBreaks,
  focusDailySummary,
  focusInterruptions,
  focusSessions,
  type FocusBreakRow,
  type FocusDailySummaryInsert,
  type FocusDailySummaryRow,
  type FocusInterruptionRow,
  type FocusSessionRow,
} from "@myos/db/schema";
import type { FocusBreak, FocusSession, Interruption } from "@myos/core/focus";
import { sessionRowToDomain, sessionToColumns } from "./mapper";

/**
 * Focus persistence (Sprint 3.2). Stores session execution state + its interruption
 * and break children, and a derived daily-summary cache. The active session is the
 * single non-terminal row. Timer/metric values are never persisted on the session.
 */
const TERMINAL = ["completed", "cancelled", "abandoned"] as const;

async function hydrate(db: Database, rows: FocusSessionRow[]): Promise<FocusSession[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [ints, brks] = await Promise.all([
    db.select().from(focusInterruptions).where(inArray(focusInterruptions.sessionId, ids)),
    db.select().from(focusBreaks).where(inArray(focusBreaks.sessionId, ids)),
  ]);
  const byInt = new Map<string, FocusInterruptionRow[]>();
  for (const i of ints) {
    const list = byInt.get(i.sessionId) ?? [];
    list.push(i);
    byInt.set(i.sessionId, list);
  }
  const byBreak = new Map<string, FocusBreakRow[]>();
  for (const b of brks) {
    const list = byBreak.get(b.sessionId) ?? [];
    list.push(b);
    byBreak.set(b.sessionId, list);
  }
  return rows.map((r) => sessionRowToDomain(r, byInt.get(r.id) ?? [], byBreak.get(r.id) ?? []));
}

/** The single active (non-terminal) session, if any. */
export async function getActive(db: Database): Promise<FocusSession | null> {
  const rows = await db
    .select()
    .from(focusSessions)
    .where(and(...TERMINAL.map((t) => ne(focusSessions.status, t))))
    .orderBy(desc(focusSessions.updatedAt))
    .limit(1);
  const [session] = await hydrate(db, rows);
  return session ?? null;
}

export async function getById(db: Database, id: string): Promise<FocusSession | null> {
  const rows = await db.select().from(focusSessions).where(eq(focusSessions.id, id)).limit(1);
  const [session] = await hydrate(db, rows);
  return session ?? null;
}

export async function listByDate(db: Database, date: string): Promise<FocusSession[]> {
  const rows = await db
    .select()
    .from(focusSessions)
    .where(eq(focusSessions.sessionDate, date))
    .orderBy(desc(focusSessions.createdAt));
  return hydrate(db, rows);
}

export async function history(db: Database, limit: number): Promise<FocusSession[]> {
  const rows = await db
    .select()
    .from(focusSessions)
    .orderBy(desc(focusSessions.createdAt))
    .limit(limit);
  return hydrate(db, rows);
}

/** Insert a new session, using the engine-generated id. */
export async function insertSession(
  db: Database,
  session: FocusSession,
  sessionDate: string,
): Promise<FocusSession> {
  const [row] = await db
    .insert(focusSessions)
    .values({ id: session.id, ...sessionToColumns(session, sessionDate), createdAt: new Date() })
    .returning();
  if (!row) throw new Error("Failed to insert focus session");
  const [hydrated] = await hydrate(db, [row]);
  return hydrated!;
}

/** Persist mutable fields of an existing session. */
export async function updateSession(
  db: Database,
  session: FocusSession,
  sessionDate: string,
): Promise<FocusSession> {
  const [row] = await db
    .update(focusSessions)
    .set(sessionToColumns(session, sessionDate))
    .where(eq(focusSessions.id, session.id))
    .returning();
  if (!row) throw new Error("Focus session not found");
  const [hydrated] = await hydrate(db, [row]);
  return hydrated!;
}

export async function insertInterruption(
  db: Database,
  sessionId: string,
  interruption: Interruption,
): Promise<void> {
  await db.insert(focusInterruptions).values({
    id: interruption.id,
    sessionId,
    type: interruption.type,
    note: interruption.note ?? null,
    at: new Date(interruption.at),
  });
}

export async function insertBreak(db: Database, sessionId: string, brk: FocusBreak): Promise<void> {
  await db.insert(focusBreaks).values({
    id: brk.id,
    sessionId,
    type: brk.type,
    plannedMinutes: brk.plannedMinutes,
    startedAt: new Date(brk.startedAt),
    endedAt: brk.endedAt ? new Date(brk.endedAt) : null,
  });
}

/** Close any open break for a session (endedAt = now). */
export async function closeOpenBreaks(db: Database, sessionId: string, at: Date): Promise<void> {
  await db
    .update(focusBreaks)
    .set({ endedAt: at })
    .where(and(eq(focusBreaks.sessionId, sessionId), isNull(focusBreaks.endedAt)));
}

// --- daily summary cache ---
export async function getSummary(
  db: Database,
  date: string,
): Promise<FocusDailySummaryRow | undefined> {
  const [row] = await db
    .select()
    .from(focusDailySummary)
    .where(eq(focusDailySummary.summaryDate, date))
    .limit(1);
  return row;
}

export async function upsertSummary(
  db: Database,
  values: FocusDailySummaryInsert,
): Promise<FocusDailySummaryRow> {
  const [row] = await db
    .insert(focusDailySummary)
    .values(values)
    .onConflictDoUpdate({
      target: focusDailySummary.summaryDate,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  if (!row) throw new Error("Failed to upsert focus summary");
  return row;
}
