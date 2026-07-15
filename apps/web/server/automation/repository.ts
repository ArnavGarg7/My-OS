import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  automationActions,
  automationConditions,
  automationHistory,
  automationRules,
  automationStatistics,
  type AutomationRuleRow,
} from "@myos/db/schema";
import {
  type AutomationRule,
  type AutomationStatistics,
  type ExecutionRecord,
} from "@myos/core/automation";
import { historyRowToRecord, rowToRule, ruleToColumns } from "./mapper";

/**
 * Automation persistence (Sprint 3.4). Stores rules + their condition tree + actions +
 * an append-only execution history + a derived statistics cache. Rules are read with
 * their conditions/actions hydrated.
 */
async function hydrate(db: Database, rows: AutomationRuleRow[]): Promise<AutomationRule[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [conds, acts] = await Promise.all([
    db.select().from(automationConditions),
    db.select().from(automationActions),
  ]);
  const condByRule = new Map(conds.map((c) => [c.ruleId, c]));
  const actsByRule = new Map<string, typeof acts>();
  for (const a of acts) {
    const list = actsByRule.get(a.ruleId) ?? [];
    list.push(a);
    actsByRule.set(a.ruleId, list);
  }
  return rows
    .filter((r) => ids.includes(r.id))
    .map((r) => rowToRule(r, condByRule.get(r.id), actsByRule.get(r.id) ?? []));
}

export async function list(db: Database): Promise<AutomationRule[]> {
  const rows = await db.select().from(automationRules).orderBy(desc(automationRules.createdAt));
  return hydrate(db, rows);
}

export async function getById(db: Database, id: string): Promise<AutomationRule | null> {
  const [row] = await db.select().from(automationRules).where(eq(automationRules.id, id)).limit(1);
  if (!row) return null;
  const [rule] = await hydrate(db, [row]);
  return rule ?? null;
}

export async function insert(db: Database, rule: AutomationRule): Promise<AutomationRule> {
  const [row] = await db
    .insert(automationRules)
    .values({ id: rule.id, ...ruleToColumns(rule), createdAt: new Date(rule.createdAt) })
    .returning();
  if (!row) throw new Error("Failed to insert automation rule");
  await db.insert(automationConditions).values({ ruleId: rule.id, tree: rule.conditions });
  if (rule.actions.length > 0) {
    // Action ids are DB-generated (draft ids like "a1" are not UUIDs); ordering
    // is preserved via actionOrder and re-read on hydrate.
    await db.insert(automationActions).values(
      rule.actions.map((a) => ({
        ruleId: rule.id,
        kind: a.kind,
        params: a.params,
        actionOrder: a.order,
      })),
    );
  }
  return (await getById(db, rule.id))!;
}

export async function update(db: Database, rule: AutomationRule): Promise<AutomationRule> {
  await db.update(automationRules).set(ruleToColumns(rule)).where(eq(automationRules.id, rule.id));
  // Replace conditions + actions (the editor is the single source).
  await db.delete(automationConditions).where(eq(automationConditions.ruleId, rule.id));
  await db.insert(automationConditions).values({ ruleId: rule.id, tree: rule.conditions });
  await db.delete(automationActions).where(eq(automationActions.ruleId, rule.id));
  if (rule.actions.length > 0) {
    // Action ids are DB-generated (draft ids like "a1" are not UUIDs); ordering
    // is preserved via actionOrder and re-read on hydrate.
    await db.insert(automationActions).values(
      rule.actions.map((a) => ({
        ruleId: rule.id,
        kind: a.kind,
        params: a.params,
        actionOrder: a.order,
      })),
    );
  }
  return (await getById(db, rule.id))!;
}

export async function setStatus(
  db: Database,
  id: string,
  status: AutomationRule["status"],
): Promise<void> {
  await db
    .update(automationRules)
    .set({ status, updatedAt: new Date() })
    .where(eq(automationRules.id, id));
}

export async function remove(db: Database, id: string): Promise<void> {
  await db.delete(automationRules).where(eq(automationRules.id, id));
}

// --- history ---
export async function recordExecution(db: Database, record: ExecutionRecord): Promise<void> {
  await db.insert(automationHistory).values({
    id: record.id,
    ruleId: record.ruleId,
    outcome: record.outcome,
    triggeredAt: new Date(record.triggeredAt),
    completedAt: record.completedAt ? new Date(record.completedAt) : null,
    runtimeMs: record.runtimeMs,
    actionResults: record.actionResults,
    error: record.error,
  });
}

export async function listHistory(
  db: Database,
  ruleId: string | undefined,
  limit: number,
): Promise<ExecutionRecord[]> {
  const rows = ruleId
    ? await db
        .select()
        .from(automationHistory)
        .where(eq(automationHistory.ruleId, ruleId))
        .orderBy(desc(automationHistory.triggeredAt))
        .limit(limit)
    : await db
        .select()
        .from(automationHistory)
        .orderBy(desc(automationHistory.triggeredAt))
        .limit(limit);
  return rows.map(historyRowToRecord);
}

/** All history (for portfolio + statistics computation). */
export async function allHistory(db: Database, limit = 1000): Promise<ExecutionRecord[]> {
  const rows = await db
    .select()
    .from(automationHistory)
    .orderBy(desc(automationHistory.triggeredAt))
    .limit(limit);
  return rows.map(historyRowToRecord);
}

// --- statistics cache ---
export async function upsertStatistics(db: Database, stats: AutomationStatistics): Promise<void> {
  const values = {
    ruleId: stats.ruleId,
    executions: stats.executions,
    successes: stats.successes,
    failures: stats.failures,
    skipped: stats.skipped,
    averageRuntimeMs: stats.averageRuntimeMs,
    failureRate: Math.round(stats.failureRate),
    lastRunAt: stats.lastRunAt ? new Date(stats.lastRunAt) : null,
    lastOutcome: stats.lastOutcome,
    updatedAt: new Date(),
  };
  await db
    .insert(automationStatistics)
    .values(values)
    .onConflictDoUpdate({ target: automationStatistics.ruleId, set: values });
}
