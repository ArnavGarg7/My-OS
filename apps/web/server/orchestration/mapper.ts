import "server-only";
import type {
  OrchestrationFailureRow,
  OrchestrationRunRow,
  OrchestrationStepRow,
} from "@myos/db/schema";
import type {
  OrchestrationFailure,
  OrchestrationModule,
  OrchestrationRun,
  OrchestrationStatus,
  RecoveryStrategy,
  StepOutcome,
  StepResult,
  TriggerSource,
} from "@myos/core/orchestration";

/**
 * Orchestration mappers (Sprint 3.5). Convert persisted rows into the pure-domain run
 * shape. Steps are stored in their own table and re-attached here.
 */
export function stepRowToResult(row: OrchestrationStepRow): StepResult {
  return {
    module: row.module,
    outcome: row.outcome as StepOutcome,
    mode: row.mode as StepResult["mode"],
    runtimeMs: row.runtimeMs,
    ...(row.detail ? { detail: row.detail } : {}),
  };
}

export function runRowToRun(
  row: OrchestrationRunRow,
  steps: OrchestrationStepRow[],
): OrchestrationRun {
  return {
    id: row.id,
    pipeline: row.pipeline as OrchestrationRun["pipeline"],
    trigger: row.trigger,
    source: row.source as TriggerSource,
    status: row.status as OrchestrationStatus,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    runtimeMs: row.runtimeMs,
    steps: steps.sort((a, b) => a.stepOrder - b.stepOrder).map(stepRowToResult),
    affected: (row.affected as OrchestrationModule[]) ?? [],
    skipped: (row.skipped as OrchestrationModule[]) ?? [],
    failures: row.failures,
    recoveries: row.recoveries,
    summary: row.summary,
  };
}

export function runToColumns(run: OrchestrationRun) {
  return {
    pipeline: run.pipeline,
    trigger: run.trigger,
    source: run.source,
    status: run.status,
    startedAt: new Date(run.startedAt),
    completedAt: run.completedAt ? new Date(run.completedAt) : null,
    runtimeMs: run.runtimeMs,
    affected: run.affected,
    skipped: run.skipped,
    failures: run.failures,
    recoveries: run.recoveries,
    summary: run.summary,
  };
}

export function failureRowToFailure(row: OrchestrationFailureRow): OrchestrationFailure {
  return {
    module: row.module,
    error: row.error,
    strategy: row.strategy as RecoveryStrategy,
    recovered: row.recovered,
  };
}
