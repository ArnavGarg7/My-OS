/**
 * Approval state machine (Sprint 6.3, spec §Approval Workflow). Pure transition logic — the ONLY
 * legal state changes. No hidden transitions; an illegal transition throws so the server can never
 * skip approval or execute an unapproved proposal.
 */
import type { AutomationState, Policy } from "./types";

/** Legal transitions. */
const TRANSITIONS: Record<AutomationState, AutomationState[]> = {
  draft: ["ready", "rejected"],
  ready: ["pending_approval", "approved", "rejected"], // trusted → straight to approved
  pending_approval: ["approved", "rejected"],
  approved: ["executing", "rejected"],
  executing: ["completed", "failed"],
  completed: ["rolled_back"], // manual rollback of a verified execution
  rejected: [],
  failed: ["rolled_back"],
  rolled_back: [],
};

/** True if `to` is a legal next state from `from`. */
export function canTransition(from: AutomationState, to: AutomationState): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Apply a transition or throw (deterministic guard). */
export function transition(from: AutomationState, to: AutomationState): AutomationState {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal automation transition: ${from} → ${to}`);
  }
  return to;
}

/**
 * The initial state a fresh proposal takes given its policy. A `trusted` proposal is `approved`
 * immediately (still executed + verified + auditable); everything else waits for the user.
 * `disabled` never becomes a proposal (guarded by the planner) — treated as rejected here.
 */
export function initialState(policy: Policy): AutomationState {
  switch (policy) {
    case "trusted":
      return "approved";
    case "disabled":
      return "rejected";
    case "always_ask":
    case "ask_once":
    default:
      return "pending_approval";
  }
}

/** Whether a proposal in this state may begin executing. */
export function isExecutable(state: AutomationState): boolean {
  return state === "approved";
}

/** Terminal states (no further transitions). */
export function isTerminal(state: AutomationState): boolean {
  return TRANSITIONS[state].length === 0;
}
