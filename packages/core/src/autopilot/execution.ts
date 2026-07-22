/**
 * Execution orchestration (Sprint 6.3, spec §Execution Engine / §Verification Engine). Pure control
 * flow — the actual side effects are INJECTED as handlers (the server binds them to real services).
 * Guarantees ordering, idempotency (a handler may report an already-applied no-op), retries, and
 * verification of post-conditions. No AI, no direct IO here.
 */
import type {
  ExecutionPlan,
  ExecutionStep,
  StepResult,
  VerificationCheck,
  VerificationResult,
} from "./types";
import { buildRollbackPlan } from "./execution-plan";

/** An injected handler that performs one action's side effect. Reports idempotent skips. */
export type ActionRunner = (
  step: ExecutionStep,
) => Promise<{ ok: boolean; detail: string; idempotentSkip?: boolean }>;

/** An injected reader that returns the current value of a verification fact. */
export type FactReader = (fact: string) => Promise<unknown>;

export interface ExecuteOptions {
  /** Max attempts per step before the step is considered failed. */
  maxAttempts?: number;
}

/** Run the plan's steps in order, retrying each up to `maxAttempts`. Deterministic control flow. */
export async function executePlan(
  plan: ExecutionPlan,
  run: ActionRunner,
  opts: ExecuteOptions = {},
): Promise<{ ok: boolean; results: StepResult[] }> {
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 2);
  const results: StepResult[] = [];
  for (const step of plan.steps) {
    let last: { ok: boolean; detail: string; idempotentSkip?: boolean } = {
      ok: false,
      detail: "not run",
    };
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      last = await run(step);
      if (last.ok) break;
    }
    results.push({
      order: step.order,
      actionKind: step.action.kind,
      ok: last.ok,
      detail: last.detail,
      idempotentSkip: last.idempotentSkip ?? false,
    });
    if (!last.ok) return { ok: false, results }; // stop on first failure → caller rolls back
  }
  return { ok: true, results };
}

/** Verify the plan's post-conditions by reading facts. Passes only if every check matches. */
export async function verifyPlan(
  checks: readonly VerificationCheck[],
  read: FactReader,
): Promise<VerificationResult> {
  const out: VerificationResult["checks"] = [];
  for (const c of checks) {
    const actual = await read(c.fact);
    out.push({ label: c.label, ok: actual === c.expected, expected: c.expected, actual });
  }
  return { passed: out.every((c) => c.ok), checks: out };
}

/** Roll a (partially or fully) executed plan back: run the inverse steps in reverse order. */
export async function rollbackPlan(
  plan: ExecutionPlan,
  run: ActionRunner,
): Promise<{ ok: boolean; results: StepResult[] }> {
  const rollbackSteps = buildRollbackPlan(plan);
  const results: StepResult[] = [];
  let allOk = true;
  for (const step of rollbackSteps) {
    const r = await run(step);
    results.push({
      order: step.order,
      actionKind: step.action.kind,
      ok: r.ok,
      detail: r.detail,
      idempotentSkip: r.idempotentSkip ?? false,
    });
    if (!r.ok) allOk = false;
  }
  return { ok: allOk, results };
}
