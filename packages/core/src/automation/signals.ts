import { buildPortfolio } from "./statistics";
import type { AutomationRule, AutomationSignals, ExecutionRecord } from "./types";

/**
 * Automation signals (Sprint 3.4). Deterministic booleans/counts for the Decision
 * engine. A "runaway" rule is one that executed far more than any other today — a hint
 * that a rule may be misfiring. The Decision engine turns these into recommendations.
 */
const RUNAWAY_THRESHOLD = 20;

export interface AutomationSignalInput {
  rules: AutomationRule[];
  history: ExecutionRecord[];
  now: Date;
  timezone: string;
}

export function computeSignals(input: AutomationSignalInput): AutomationSignals {
  const portfolio = buildPortfolio(input.rules, input.history, input.now, input.timezone);

  // Runaway detection: any single rule with an outsized share of today's executions.
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: input.timezone });
  const todayKey = fmt.format(input.now);
  const perRule = new Map<string, number>();
  for (const h of input.history) {
    if (fmt.format(new Date(h.triggeredAt)) !== todayKey) continue;
    if (h.outcome !== "completed" && h.outcome !== "failed") continue;
    perRule.set(h.ruleId, (perRule.get(h.ruleId) ?? 0) + 1);
  }
  const runawayRule = [...perRule.values()].some((n) => n >= RUNAWAY_THRESHOLD);

  return {
    enabledRules: portfolio.enabledRules,
    failuresToday: portfolio.failuresToday,
    pendingApprovals: portfolio.pendingApprovals,
    runawayRule,
  };
}
