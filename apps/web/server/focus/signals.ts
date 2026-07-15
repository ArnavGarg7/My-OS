import "server-only";
import { computeSignals, type FocusSignals } from "@myos/core/focus";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { and, eq } from "drizzle-orm";
import { plannerBlocks } from "@myos/db/schema";
import * as repo from "./repository";

/**
 * Focus signals for the Decision engine (Sprint 3.2). Reads the active session +
 * today's sessions and whether the Planner still has open blocks, then runs the pure
 * core `computeSignals`. Focus never emits decisions — it only supplies signals.
 */
async function plannerBlocksPending(db: Database, date: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: plannerBlocks.id })
      .from(plannerBlocks)
      .where(and(eq(plannerBlocks.plannerDate, date), eq(plannerBlocks.completed, false)))
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function focusSignals(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<FocusSignals> {
  const date = todayInTimeZone(tz);
  const [active, todaysSessions, pending] = await Promise.all([
    repo.getActive(db).catch(() => null),
    repo.listByDate(db, date).catch(() => []),
    plannerBlocksPending(db, date),
  ]);
  return computeSignals({ active, todaysSessions, plannerBlocksPending: pending, now });
}
