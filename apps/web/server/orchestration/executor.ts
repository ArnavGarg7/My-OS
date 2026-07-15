import "server-only";
import {
  decideRecovery,
  type ExecutionPlan,
  type ExecutionStep,
  type OrchestrationFailure,
  type RecoveryDecision,
  type StepResult,
} from "@myos/core/orchestration";
import { MAX_STEP_RETRIES } from "@myos/core/orchestration";
import type { Database } from "@myos/db";
import * as plannerService from "../planner/service";
import * as decisionService from "../decision/service";
import * as notificationService from "../notification/service";

/**
 * Server orchestration executor (Sprint 3.5). Runs a plan's steps IN ORDER by asking
 * EXISTING services to update — never duplicating their logic. Only modules with a
 * concrete "update" entrypoint call a service (planner/decision/notification/timeline);
 * every other step is a deterministic record/refresh acknowledgement (that module
 * already changed its own state before triggering, or derives on read). Failures are
 * recovered deterministically with no cascading — skip_downstream removes dependents.
 */
export interface ExecutorContext {
  db: Database;
  tz: string;
  prefs: { preferredStartOfDay: string; preferredEndOfDay: string };
}

export interface ExecutorResult {
  steps: StepResult[];
  failures: OrchestrationFailure[];
  recoveries: RecoveryDecision[];
}

/** Whether a step actually calls a downstream service (vs a deterministic ack). */
async function runStep(step: ExecutionStep, ctx: ExecutorContext): Promise<string> {
  const { db, tz, prefs } = ctx;
  if (step.mode === "regenerate") {
    switch (step.module) {
      case "planner":
        await plannerService.generate(db, tz, prefs);
        return "planner regenerated";
      case "decision":
        await decisionService.generate(db, tz, prefs);
        return "decision regenerated";
      case "notification":
        await notificationService.generate(db, tz);
        return "notifications regenerated";
      default:
        return `${step.module} regenerated`;
    }
  }
  if (step.module === "decision" && step.mode === "refresh") {
    await decisionService.generate(db, tz, prefs);
    return "decision refreshed";
  }
  // record / refresh / recommend for other modules (incl. timeline/analytics/morning/
  // tomorrow): the module owns its own state and derives on read; each already emits its
  // own timeline/analytics events on mutation. Orchestration only acknowledges the step
  // deterministically here — the run itself is recorded to timeline at the service level.
  return `${step.module} ${step.mode}`;
}

export async function executePlan(
  plan: ExecutionPlan,
  ctx: ExecutorContext,
  now: () => Date = () => new Date(),
): Promise<ExecutorResult> {
  const steps: StepResult[] = [];
  const failures: OrchestrationFailure[] = [];
  const recoveries: RecoveryDecision[] = [];
  const skip = new Set<string>();

  for (const step of plan.order) {
    if (skip.has(step.module)) {
      steps.push({
        module: step.module,
        outcome: "skipped",
        mode: step.mode,
        runtimeMs: null,
        detail: "Skipped by recovery.",
      });
      continue;
    }

    let attempts = 0;
    let done = false;
    while (!done) {
      const start = now().getTime();
      try {
        const detail = await runStep(step, ctx);
        steps.push({
          module: step.module,
          outcome: attempts > 0 ? "recovered" : "completed",
          mode: step.mode,
          runtimeMs: Math.max(0, now().getTime() - start),
          detail,
        });
        done = true;
      } catch (err) {
        attempts += 1;
        const decision = decideRecovery(step.module, plan, attempts);
        const message = err instanceof Error ? err.message : "step failed";

        if (decision.strategy === "retry_step" && attempts <= MAX_STEP_RETRIES) {
          continue; // retry the same step
        }

        for (const m of decision.skip) skip.add(m);
        recoveries.push(decision);
        const recovered = decision.strategy !== "abort";
        failures.push({
          module: step.module,
          error: message,
          strategy: decision.strategy,
          recovered,
        });
        steps.push({
          module: step.module,
          outcome: recovered ? "recovered" : "failed",
          mode: step.mode,
          runtimeMs: Math.max(0, now().getTime() - start),
          detail: decision.reason,
          recovery: decision.strategy,
        });
        done = true;
        if (decision.strategy === "abort") return { steps, failures, recoveries };
      }
    }
  }

  return { steps, failures, recoveries };
}
