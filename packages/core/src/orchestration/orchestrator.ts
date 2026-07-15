import type { OrchestrationStatus } from "./constants";
import { buildPlan } from "./execution-plan";
import { pipelineForEvent } from "./pipeline";
import type {
  ExecutionPlan,
  OrchestrationContext,
  OrchestrationRun,
  OrchestrationTrigger,
  StepResult,
} from "./types";

/**
 * Orchestrator (Sprint 3.5). Pure coordination: resolve a trigger to a pipeline, build
 * the deterministic execution plan, and assemble a run record from the step results the
 * SERVER produced (the server runs the actual services). The orchestrator never
 * executes anything itself and holds no feature logic.
 */
export function planForTrigger(
  trigger: OrchestrationTrigger,
  ctx: OrchestrationContext,
): ExecutionPlan {
  return buildPlan(trigger.pipeline, trigger.event, ctx);
}

/** Resolve an event string to a plan (server-facing convenience). */
export function planForEvent(event: string, ctx: OrchestrationContext): ExecutionPlan | null {
  const pipeline = pipelineForEvent(event);
  if (!pipeline) return null;
  return buildPlan(pipeline, event, ctx);
}

/** Assemble a completed run record from a plan + its step results. */
export function assembleRun(
  id: string,
  trigger: OrchestrationTrigger,
  plan: ExecutionPlan,
  steps: StepResult[],
  startedAt: Date,
  completedAt: Date,
): OrchestrationRun {
  const failures = steps.filter((s) => s.outcome === "failed").length;
  const recoveries = steps.filter((s) => s.outcome === "recovered").length;
  const status = runStatus(steps);

  return {
    id,
    pipeline: trigger.pipeline,
    trigger: trigger.event,
    source: trigger.source,
    status,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    runtimeMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
    steps,
    affected: plan.affected,
    skipped: plan.skipped,
    failures,
    recoveries,
    summary: runSummary(trigger.pipeline, steps, failures, recoveries, plan.skipped.length),
  };
}

function runStatus(steps: StepResult[]): OrchestrationStatus {
  const hasFailed = steps.some((s) => s.outcome === "failed");
  const hasRecovered = steps.some((s) => s.outcome === "recovered");
  if (hasFailed) return "failed";
  if (hasRecovered) return "recovered";
  return "completed";
}

function runSummary(
  pipeline: string,
  steps: StepResult[],
  failures: number,
  recoveries: number,
  skipped: number,
): string {
  const done = steps.filter((s) => s.outcome === "completed").length;
  const parts = [`${pipeline}: ${done} completed`];
  if (recoveries > 0) parts.push(`${recoveries} recovered`);
  if (failures > 0) parts.push(`${failures} failed`);
  if (skipped > 0) parts.push(`${skipped} skipped`);
  return parts.join(", ");
}
