import { MAX_RUN_STEPS, MODULE_DEPENDENCIES, type PipelineKind } from "./constants";
import { hasCycle, subgraph } from "./dependency-graph";
import { pipelineModules } from "./pipeline";
import type { ExecutionPlan, OrchestrationRun } from "./types";

/**
 * Orchestration validation (Sprint 3.5). Deterministic guards that prevent unsafe
 * orchestration: recursive/infinite runs, duplicate execution, circular dependencies
 * and repeated regeneration of the same pipeline.
 */
export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const REPEATED_REGEN_THRESHOLD = 5;

export function validatePlan(
  plan: ExecutionPlan,
  history: OrchestrationRun[] = [],
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Too many steps (runaway expansion).
  if (plan.order.length > MAX_RUN_STEPS) {
    issues.push({ code: "too-many-steps", message: `Plan exceeds ${MAX_RUN_STEPS} steps.` });
  }

  // Duplicate module in the ordered execution list (would double-execute).
  const seen = new Set<string>();
  for (const step of plan.order) {
    if (seen.has(step.module)) {
      issues.push({ code: "duplicate-step", message: `${step.module} appears twice in the plan.` });
    }
    seen.add(step.module);
  }

  // Circular dependency within the pipeline's module subgraph.
  const nodes = pipelineModules(plan.pipeline as PipelineKind);
  if (hasCycle(nodes, subgraph(nodes, MODULE_DEPENDENCIES))) {
    issues.push({ code: "cycle", message: "Pipeline subgraph contains a dependency cycle." });
  }

  // Repeated regeneration: same pipeline run many times in the recent window.
  const sameToday = history.filter((r) => r.pipeline === plan.pipeline).length;
  if (sameToday >= REPEATED_REGEN_THRESHOLD) {
    issues.push({
      code: "repeated-regeneration",
      message: `The ${plan.pipeline} pipeline has run ${sameToday} times recently.`,
    });
  }

  return { valid: issues.length === 0, issues };
}

/** Guard against recursive orchestration — a run must not trigger its own pipeline. */
export function isRecursive(
  pipeline: PipelineKind,
  triggerSourcePipeline: PipelineKind | null,
): boolean {
  return triggerSourcePipeline === pipeline;
}
