import "server-only";
import type {
  AutomationActionRow,
  AutomationConditionRow,
  AutomationHistoryRow,
  AutomationRuleRow,
} from "@myos/db/schema";
import {
  emptyConditions,
  type Action,
  type AutomationPriority,
  type AutomationRule,
  type ConditionGroup,
  type ExecutionOutcome,
  type ExecutionPolicyConfig,
  type ExecutionRecord,
} from "@myos/core/automation";

/**
 * Automation mappers (Sprint 3.4). Convert persisted rows into the pure-domain shapes
 * the engine operates on, and back. Statistics + execution decisions are never stored
 * as source of truth — they derive from rules + history.
 */
export function rowToRule(
  row: AutomationRuleRow,
  conditions: AutomationConditionRow | undefined,
  actions: AutomationActionRow[],
): AutomationRule {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority as AutomationPriority,
    trigger: { kind: row.triggerKind, event: row.triggerEvent },
    conditions: (conditions?.tree as ConditionGroup) ?? emptyConditions(),
    actions: actions
      .map((a): Action => ({
        id: a.id,
        kind: a.kind,
        params: (a.params as Record<string, unknown>) ?? {},
        order: a.actionOrder,
      }))
      .sort((a, b) => a.order - b.order),
    policy: (row.policy as ExecutionPolicyConfig) ?? { policy: "run_always" },
    builtIn: row.builtIn,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function ruleToColumns(rule: AutomationRule) {
  return {
    name: rule.name,
    description: rule.description,
    status: rule.status,
    priority: rule.priority,
    triggerKind: rule.trigger.kind,
    triggerEvent: rule.trigger.event,
    policy: rule.policy,
    builtIn: rule.builtIn,
    updatedAt: new Date(),
  };
}

export function historyRowToRecord(row: AutomationHistoryRow): ExecutionRecord {
  return {
    id: row.id,
    ruleId: row.ruleId,
    outcome: row.outcome as ExecutionOutcome,
    triggeredAt: row.triggeredAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    runtimeMs: row.runtimeMs,
    actionResults: (row.actionResults as ExecutionRecord["actionResults"]) ?? [],
    error: row.error,
  };
}
