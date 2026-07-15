import type {
  AutomationRule,
  AutomationPortfolio,
  AutomationStatistics,
  ExecutionRecord,
} from "./types";

/**
 * Automation statistics (Sprint 3.4). DERIVED ONLY — never stored redundantly. All
 * numbers reproduce from the execution history.
 */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function statsForRule(ruleId: string, history: ExecutionRecord[]): AutomationStatistics {
  const runs = history.filter((h) => h.ruleId === ruleId);
  const successes = runs.filter((h) => h.outcome === "completed");
  const failures = runs.filter((h) => h.outcome === "failed");
  const skipped = runs.filter((h) => h.outcome === "skipped");
  const runtimes = successes.map((h) => h.runtimeMs ?? 0);
  const executions = successes.length + failures.length;
  const last = runs.length > 0 ? runs[runs.length - 1]! : null;

  return {
    ruleId,
    executions,
    successes: successes.length,
    failures: failures.length,
    skipped: skipped.length,
    averageRuntimeMs:
      runtimes.length > 0 ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : 0,
    failureRate: executions === 0 ? 0 : round1((failures.length / executions) * 100),
    lastRunAt: last?.triggeredAt ?? null,
    lastOutcome: last?.outcome ?? null,
  };
}

function isToday(iso: string, timezone: string, now: Date): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
  return fmt.format(new Date(iso)) === fmt.format(now);
}

export function buildPortfolio(
  rules: AutomationRule[],
  history: ExecutionRecord[],
  now: Date,
  timezone: string,
): AutomationPortfolio {
  const today = history.filter((h) => isToday(h.triggeredAt, timezone, now));
  const successesToday = today.filter((h) => h.outcome === "completed").length;
  const failuresToday = today.filter((h) => h.outcome === "failed").length;
  const pendingApprovals = history.filter((h) => h.outcome === "pending_approval").length;

  // Most triggered / most successful.
  const triggerCounts = new Map<string, number>();
  const successCounts = new Map<string, number>();
  for (const h of history) {
    triggerCounts.set(h.ruleId, (triggerCounts.get(h.ruleId) ?? 0) + 1);
    if (h.outcome === "completed")
      successCounts.set(h.ruleId, (successCounts.get(h.ruleId) ?? 0) + 1);
  }
  const topOf = (m: Map<string, number>): string | null => {
    let best: string | null = null;
    let bestN = 0;
    for (const [id, n] of m) {
      if (n > bestN) {
        bestN = n;
        best = id;
      }
    }
    return best;
  };

  return {
    totalRules: rules.length,
    enabledRules: rules.filter((r) => r.status === "enabled").length,
    executionsToday: successesToday + failuresToday,
    successesToday,
    failuresToday,
    pendingApprovals,
    mostTriggeredRuleId: topOf(triggerCounts),
    mostSuccessfulRuleId: topOf(successCounts),
  };
}
