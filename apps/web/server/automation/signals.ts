import "server-only";
import { computeSignals, type AutomationSignals } from "@myos/core/automation";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Automation signals (Sprint 3.4) for the Decision engine. Reads rules + history and
 * runs the pure `computeSignals`. Automation never emits decisions — it only supplies
 * signals (failures, pending approvals, a runaway rule).
 */
export async function automationSignals(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<AutomationSignals> {
  const [rules, history] = await Promise.all([
    repo.list(db).catch(() => []),
    repo.allHistory(db).catch(() => []),
  ]);
  return computeSignals({ rules, history, now, timezone: tz });
}
