import {
  MAX_STEP_RETRIES,
  MODULE_DEPENDENCIES,
  type OrchestrationModule,
  type RecoveryStrategy,
} from "./constants";
import { affectedModules } from "./dependency-graph";
import type { ExecutionPlan, RecoveryDecision } from "./types";

/**
 * Recovery engine (Sprint 3.5). Deterministic recovery strategies — no cascading
 * failures. Each module has a default strategy derived from the spec:
 *   • planner generation failed  → retry the planner step only
 *   • calendar sync failed        → skip downstream, notify (nothing changed)
 *   • health unavailable          → downstream uses previous value
 *   • timeline unavailable        → skip downstream (analytics skips too)
 *   • notification failure         → skip that step, continue
 * Pure — decides the strategy; the server applies it.
 */
export const DEFAULT_RECOVERY: Record<OrchestrationModule, RecoveryStrategy> = {
  calendar: "skip_downstream",
  planner: "retry_step",
  focus: "skip_step",
  task: "skip_step",
  decision: "skip_step",
  health: "use_previous",
  finance: "skip_step",
  goal: "skip_step",
  project: "skip_step",
  inbox: "skip_step",
  notification: "skip_step",
  morning: "skip_step",
  tomorrow: "skip_step",
  timeline: "skip_downstream",
  analytics: "skip_step",
};

/** Decide how to recover a failed step within a plan. */
export function decideRecovery(
  module: OrchestrationModule,
  plan: ExecutionPlan,
  attempts: number,
): RecoveryDecision {
  const strategy = DEFAULT_RECOVERY[module];

  // Retry is only viable while under the attempt cap; otherwise degrade to skip.
  if (strategy === "retry_step" && attempts >= MAX_STEP_RETRIES) {
    return {
      module,
      strategy: "skip_step",
      skip: [],
      reason: `Retry limit reached for ${module}; skipping this step.`,
    };
  }

  if (strategy === "skip_downstream") {
    const downstream = affectedModules(module, MODULE_DEPENDENCIES).filter((m) =>
      plan.affected.includes(m),
    );
    return {
      module,
      strategy,
      skip: downstream,
      reason: `${module} failed; skipping ${downstream.length} downstream module(s).`,
    };
  }

  return {
    module,
    strategy,
    skip: [],
    reason: reasonFor(strategy, module),
  };
}

function reasonFor(strategy: RecoveryStrategy, module: OrchestrationModule): string {
  switch (strategy) {
    case "retry_step":
      return `Retrying ${module}.`;
    case "use_previous":
      return `${module} unavailable; downstream uses its previous value.`;
    case "skip_step":
      return `${module} failed; skipping only this step and continuing.`;
    case "notify_user":
      return `${module} failed; notifying the user.`;
    case "abort":
      return `${module} failed critically; aborting the run.`;
    default:
      return `${module} recovery: ${strategy}.`;
  }
}

/** Whether a strategy means the overall run still counts as recovered (not failed). */
export function isRecoverable(strategy: RecoveryStrategy): boolean {
  return strategy !== "abort";
}
