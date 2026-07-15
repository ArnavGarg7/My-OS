import type { AutomationRule, AutomationSummary, ExecutionRecord } from "./types";
import { buildPortfolio } from "./statistics";

/**
 * Automation selectors (Sprint 3.4). Pure read helpers over rules + history.
 */
export function enabledRules(rules: AutomationRule[]): AutomationRule[] {
  return rules.filter((r) => r.status === "enabled");
}

export function builtInRules(rules: AutomationRule[]): AutomationRule[] {
  return rules.filter((r) => r.builtIn);
}

export function customRules(rules: AutomationRule[]): AutomationRule[] {
  return rules.filter((r) => !r.builtIn);
}

export function rulesByKind(rules: AutomationRule[], kind: string): AutomationRule[] {
  return rules.filter((r) => r.trigger.kind === kind);
}

export function pendingExecutions(history: ExecutionRecord[]): ExecutionRecord[] {
  return history.filter((h) => h.outcome === "pending_approval");
}

export function recentFailures(history: ExecutionRecord[]): ExecutionRecord[] {
  return history.filter((h) => h.outcome === "failed");
}

export function buildSummary(
  rules: AutomationRule[],
  history: ExecutionRecord[],
  now: Date,
  timezone: string,
): AutomationSummary {
  const portfolio = buildPortfolio(rules, history, now, timezone);
  const runningNow = history.filter((h) => h.outcome === "executing").length;
  return {
    enabledRules: portfolio.enabledRules,
    runningNow,
    pending: portfolio.pendingApprovals,
    failedToday: portfolio.failuresToday,
    executedToday: portfolio.executionsToday,
  };
}
