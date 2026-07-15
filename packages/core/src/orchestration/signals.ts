import { buildSummary, runsToday } from "./selectors";
import type { OrchestrationRun, OrchestrationSignals } from "./types";

/**
 * Orchestration signals (Sprint 3.5) for the Decision engine. Deterministic booleans +
 * counts derived from the run history. The Decision engine turns these into
 * recommendations; orchestration never emits decisions.
 */
export interface OrchestrationSignalInput {
  history: OrchestrationRun[];
  now: Date;
  timezone: string;
  pendingPipelines: number;
}

export function computeSignals(input: OrchestrationSignalInput): OrchestrationSignals {
  const summary = buildSummary(input.history, input.now, input.timezone);
  const today = runsToday(input.history, input.now, input.timezone);

  return {
    healthy: summary.systemReady,
    running: today.some((r) => r.status === "running"),
    recovering: today.some((r) => r.status === "recovering"),
    failuresToday: summary.failuresToday,
    pendingPipelines: input.pendingPipelines,
  };
}
