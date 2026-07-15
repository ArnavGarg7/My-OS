import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  createFocusEngine,
  buildRecommendations,
  buildReadiness,
  type BreakType,
  type FocusRecommendation,
  type FocusSession,
  type InterruptionType,
  type SessionType,
  type StartSessionInput,
} from "@myos/core/focus";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { plannerBlocks } from "@myos/db/schema";
import { buildSignals as buildHealthSignals } from "../health/summary";
import * as repo from "./repository";
import { persistDailySummary } from "./summary";

/**
 * FocusService (Sprint 3.2). Orchestrates the pure FocusEngine over persistence. It
 * loads the active session, applies a transition, saves it, refreshes the derived
 * daily-summary cache and (on completion) updates planner EXECUTION state only. It
 * never mutates the planner schedule and never auto-completes tasks.
 */
const engine = createFocusEngine(
  () => randomUUID(),
  () => new Date(),
);

function dateFor(tz: string): string {
  return todayInTimeZone(tz);
}

async function requireSession(db: Database, id: string): Promise<FocusSession> {
  const s = await repo.getById(db, id);
  if (!s) throw new Error("Focus session not found");
  return s;
}

async function refreshSummary(db: Database, tz: string): Promise<void> {
  await persistDailySummary(db, tz).catch(() => undefined);
}

/** Mark a planner block's EXECUTION state complete — never touches its schedule. */
async function markPlannerBlockComplete(db: Database, blockId: string): Promise<void> {
  await db
    .update(plannerBlocks)
    .set({ completed: true })
    .where(and(eq(plannerBlocks.id, blockId), eq(plannerBlocks.completed, false)))
    .catch(() => undefined);
}

export function active(db: Database): Promise<FocusSession | null> {
  return repo.getActive(db);
}

export async function start(
  db: Database,
  tz: string,
  input: StartSessionInput,
): Promise<FocusSession> {
  // Only one active session at a time — abandon any existing one first.
  const existing = await repo.getActive(db);
  if (existing) {
    const abandoned = engine.abandon(existing);
    await repo.updateSession(db, abandoned, dateFor(tz));
  }
  const session = engine.start(input);
  const saved = await repo.insertSession(db, session, dateFor(tz));
  await refreshSummary(db, tz);
  return saved;
}

export async function pause(db: Database, tz: string, id: string): Promise<FocusSession> {
  const session = engine.pause(await requireSession(db, id));
  return repo.updateSession(db, session, dateFor(tz));
}

export async function resume(db: Database, tz: string, id: string): Promise<FocusSession> {
  const current = await requireSession(db, id);
  const session = engine.resume(current);
  await repo.closeOpenBreaks(db, id, new Date());
  return repo.updateSession(db, session, dateFor(tz));
}

export async function complete(
  db: Database,
  tz: string,
  id: string,
  energyAfter?: number | null,
  notes?: string,
): Promise<FocusSession> {
  let current = await requireSession(db, id);
  if (typeof notes === "string") current = engine.setNotes(current, notes);
  const session = engine.complete(current, energyAfter ?? null);
  await repo.closeOpenBreaks(db, id, new Date());
  const saved = await repo.updateSession(db, session, dateFor(tz));
  if (saved.plannerBlockId) await markPlannerBlockComplete(db, saved.plannerBlockId);
  await refreshSummary(db, tz);
  return saved;
}

export async function cancel(db: Database, tz: string, id: string): Promise<FocusSession> {
  const session = engine.cancel(await requireSession(db, id));
  const saved = await repo.updateSession(db, session, dateFor(tz));
  await refreshSummary(db, tz);
  return saved;
}

export async function abandon(db: Database, tz: string, id: string): Promise<FocusSession> {
  const session = engine.abandon(await requireSession(db, id));
  const saved = await repo.updateSession(db, session, dateFor(tz));
  await refreshSummary(db, tz);
  return saved;
}

export async function beginBreak(
  db: Database,
  tz: string,
  id: string,
  type?: BreakType,
  minutes?: number,
): Promise<FocusSession> {
  const current = await requireSession(db, id);
  const readinessScore = await healthReadinessScore(db, tz);
  const { session, brk } = engine.beginBreak(current, {
    ...(type ? { type } : {}),
    ...(minutes ? { minutes } : {}),
    readinessScore,
  });
  await repo.insertBreak(db, id, brk);
  return repo.updateSession(db, session, dateFor(tz));
}

export async function addInterruption(
  db: Database,
  tz: string,
  id: string,
  type: InterruptionType,
  note?: string,
): Promise<FocusSession> {
  const current = await requireSession(db, id);
  const { session, interruption } = engine.addInterruption(current, type, note);
  await repo.insertInterruption(db, id, interruption);
  return repo.updateSession(db, session, dateFor(tz));
}

export async function switchTask(
  db: Database,
  tz: string,
  id: string,
  target: { taskId?: string | null; projectId?: string | null; plannerBlockId?: string | null },
): Promise<FocusSession> {
  const session = engine.switchTask(await requireSession(db, id), target);
  return repo.updateSession(db, session, dateFor(tz));
}

export async function setNotes(
  db: Database,
  tz: string,
  id: string,
  notes: string,
): Promise<FocusSession> {
  const session = engine.setNotes(await requireSession(db, id), notes);
  return repo.updateSession(db, session, dateFor(tz));
}

export function history(db: Database, limit = 50): Promise<FocusSession[]> {
  return repo.history(db, limit);
}

export function listToday(db: Database, tz: string): Promise<FocusSession[]> {
  return repo.listByDate(db, dateFor(tz));
}

async function healthReadinessScore(db: Database, tz: string): Promise<number | null> {
  try {
    const h = await buildHealthSignals(db, dateFor(tz), new Date());
    return h.readiness;
  } catch {
    return null;
  }
}

export async function recommendations(db: Database, tz: string): Promise<FocusRecommendation[]> {
  const [session, health] = await Promise.all([
    repo.getActive(db).catch(() => null),
    buildHealthSignals(db, dateFor(tz), new Date()).catch(() => null),
  ]);
  const readiness = health
    ? buildReadiness({
        score: health.readiness,
        hydrationPercent: health.hydrationPercent,
        recovery: health.recovery,
        sleepMinutes: health.sleepMinutes,
      })
    : null;
  return buildRecommendations(session, new Date(), readiness);
}

// re-export session type reference to keep the surface obvious to callers.
export type { SessionType };
