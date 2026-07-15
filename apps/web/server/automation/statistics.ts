import "server-only";
import {
  buildPortfolio,
  statsForRule,
  type AutomationPortfolio,
  type AutomationStatistics,
} from "@myos/core/automation";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Server statistics (Sprint 3.4). Derives per-rule + portfolio statistics from the
 * execution history and refreshes the cache. Numbers are always reproducible.
 */
export async function ruleStatistics(db: Database, ruleId: string): Promise<AutomationStatistics> {
  const history = await repo.listHistory(db, ruleId, 500);
  const stats = statsForRule(ruleId, history);
  await repo.upsertStatistics(db, stats).catch(() => undefined);
  return stats;
}

export async function portfolio(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<AutomationPortfolio> {
  const [rules, history] = await Promise.all([repo.list(db), repo.allHistory(db)]);
  return buildPortfolio(rules, history, now, tz);
}
