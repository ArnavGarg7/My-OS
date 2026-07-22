/**
 * Execution Planner + Rollback + Verification builders (Sprint 6.3, spec §Execution Planner /
 * §Rollback Engine / §Verification Engine). Pure: turns an automation's actions into a deterministic,
 * immutable, ordered ExecutionPlan — with a rollback for every mutating step and post-condition
 * checks. A mutating step with no inverse makes the plan invalid (rollback must exist BEFORE
 * execution). No IO, no AI.
 */
import type { Action, Automation, ExecutionPlan, ExecutionStep, VerificationCheck } from "./types";

export interface PlanDeps {
  newId: () => string;
}

/** The inverse action for a mutating action (the rollback). Null for non-mutating actions. */
export function inverseAction(action: Action): Action | null {
  if (!action.mutating) return null;
  switch (action.kind) {
    case "dismiss_expired_signal":
    case "mark_stale_opportunity":
      return {
        kind: action.kind,
        label: `Restore: ${action.label}`,
        params: { ...action.params, restore: true },
        mutating: true,
      };
    case "archive_completed_notification":
      return {
        kind: action.kind,
        label: `Unarchive: ${action.label}`,
        params: { ...action.params, restore: true },
        mutating: true,
      };
    default:
      return null;
  }
}

/** The verification checks for an action (post-conditions confirming the effect took). */
function checksFor(action: Action): VerificationCheck[] {
  switch (action.kind) {
    case "dismiss_expired_signal":
    case "mark_stale_opportunity":
      return [{ label: "signal acknowledged", fact: "signal.status", expected: "acknowledged" }];
    case "archive_completed_notification":
      return [{ label: "notification archived", fact: "notification.archived", expected: true }];
    case "refresh_prediction_cache":
      return [{ label: "forecast recomputed", fact: "prediction.refreshed", expected: true }];
    case "refresh_dashboard":
      return [{ label: "dashboard refreshed", fact: "dashboard.refreshed", expected: true }];
    default:
      return [];
  }
}

/**
 * Build an immutable execution plan from an automation. Throws if a mutating action has no inverse —
 * a mutating automation without a rollback path must never reach execution.
 */
export function buildExecutionPlan(automation: Automation, deps: PlanDeps): ExecutionPlan {
  const steps: ExecutionStep[] = automation.actions.map((action, i) => {
    const rollback = inverseAction(action);
    if (action.mutating && !rollback) {
      throw new Error(`No rollback for mutating action "${action.kind}" — execution refused`);
    }
    return { order: i + 1, action, rollback };
  });
  const verifications = automation.actions.flatMap(checksFor);
  return { id: deps.newId(), steps, verifications };
}

/** The rollback plan: the inverse steps in REVERSE order (undo last-applied first). */
export function buildRollbackPlan(plan: ExecutionPlan): ExecutionStep[] {
  return plan.steps
    .filter((s) => s.rollback)
    .slice()
    .reverse()
    .map((s, i) => ({ order: i + 1, action: s.rollback as Action, rollback: null }));
}

/** True if every mutating step has a rollback (a plan is executable only when fully reversible). */
export function isFullyReversible(plan: ExecutionPlan): boolean {
  return plan.steps.every((s) => !s.action.mutating || s.rollback !== null);
}
