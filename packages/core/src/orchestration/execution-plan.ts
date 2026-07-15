import { MODULE_DEPENDENCIES, type OrchestrationModule, type PipelineKind } from "./constants";
import { pipelineModules, pipelineSteps } from "./pipeline";
import { subgraph } from "./dependency-graph";
import type { ExecutionPlan, ExecutionStep, OrchestrationContext } from "./types";

/**
 * Execution planning (Sprint 3.5). Turns a pipeline + context into a deterministic
 * ExecutionPlan: the ordered steps, which modules are affected, which are skipped
 * (unavailable), a per-step mode and dependency links. Pure — no execution. The plan
 * is fully surfaced to the user (nothing hidden).
 */
export function buildPlan(
  pipeline: PipelineKind,
  trigger: string,
  ctx: OrchestrationContext,
): ExecutionPlan {
  const steps = pipelineSteps(pipeline);
  const modules = pipelineModules(pipeline);
  const graph = subgraph(modules, MODULE_DEPENDENCIES);
  const unavailable = new Set(ctx.unavailable);

  const order: ExecutionStep[] = [];
  const skipped: OrchestrationModule[] = [];

  steps.forEach((step, i) => {
    if (unavailable.has(step.module)) {
      skipped.push(step.module);
      return;
    }
    // Upstream deps: earlier steps whose graph edges point AT this module.
    const dependsOn = steps
      .slice(0, i)
      .map((s) => s.module)
      .filter((m) => (graph[m] ?? []).includes(step.module));
    order.push({ module: step.module, order: order.length, mode: step.mode, dependsOn });
  });

  const affected = order.map((s) => s.module);
  const summary = buildSummary(pipeline, trigger, affected, skipped);

  return { pipeline, trigger, affected, order, skipped, summary };
}

function buildSummary(
  pipeline: PipelineKind,
  trigger: string,
  affected: OrchestrationModule[],
  skipped: OrchestrationModule[],
): string {
  const base = `${pipeline} pipeline (${trigger}): ${affected.length} module${affected.length === 1 ? "" : "s"} in order`;
  return skipped.length > 0 ? `${base}; ${skipped.length} skipped (unavailable)` : base;
}

/** The dependency edges within a plan (for the execution graph UI). */
export function planEdges(
  plan: ExecutionPlan,
): { from: OrchestrationModule; to: OrchestrationModule }[] {
  const edges: { from: OrchestrationModule; to: OrchestrationModule }[] = [];
  for (const step of plan.order) {
    for (const dep of step.dependsOn) edges.push({ from: dep, to: step.module });
  }
  return edges;
}
