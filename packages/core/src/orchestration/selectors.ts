import { FULL_RUN_THRESHOLD, ORCHESTRATION_MODULES } from "./constants";
import type { OrchestrationRun, OrchestrationSummary, StepResult } from "./types";

/**
 * Orchestration selectors (Sprint 3.5). Pure read helpers over run history.
 */
function isToday(iso: string, timezone: string, now: Date): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
  return fmt.format(new Date(iso)) === fmt.format(now);
}

export function runsToday(
  history: OrchestrationRun[],
  now: Date,
  timezone: string,
): OrchestrationRun[] {
  return history.filter((r) => isToday(r.startedAt, timezone, now));
}

export function failedRuns(history: OrchestrationRun[]): OrchestrationRun[] {
  return history.filter((r) => r.status === "failed");
}

export function recoveredRuns(history: OrchestrationRun[]): OrchestrationRun[] {
  return history.filter((r) => r.status === "recovered");
}

export function isFullRun(run: OrchestrationRun): boolean {
  return run.affected.length / ORCHESTRATION_MODULES.length >= FULL_RUN_THRESHOLD;
}

export function failedSteps(run: OrchestrationRun): StepResult[] {
  return run.steps.filter((s) => s.outcome === "failed");
}

export function buildSummary(
  history: OrchestrationRun[],
  now: Date,
  timezone: string,
): OrchestrationSummary {
  const today = runsToday(history, now, timezone);
  const last = history.length > 0 ? history[0]! : null;
  const failuresToday = today.filter((r) => r.status === "failed").length;
  const recoveriesToday = today.reduce((n, r) => n + r.recoveries, 0);

  return {
    status: last?.status ?? "completed",
    lastRunAt: last?.startedAt ?? null,
    runsToday: today.length,
    failuresToday,
    recoveriesToday,
    affectedModulesLastRun: last?.affected.length ?? 0,
    systemReady: failuresToday === 0 && (last?.status ?? "completed") !== "failed",
  };
}
