/**
 * @myos/core/autopilot — the Proposal-First Automation Engine (Sprint 6.3, Phase 6). A pure,
 * deterministic layer that turns Signals + Prediction Signals into executable **proposals** the user
 * reviews and approves — and, for explicitly-trusted low-risk cases, lets run within policy. Every
 * mutation is intentional, reversible (rollback exists before execution), verified, idempotent and
 * auditable. **The AI never executes** — it only explains and prioritizes deterministic plans.
 *
 *   signals + predictions → planner → execution plan → proposal → approval → execution →
 *   verification → (rollback on failure) → audit → timeline → Chief
 */
export * from "./types";
export { AUTOMATIONS, getAutomation, automationsForTrigger } from "./registry";
export {
  evaluateCondition,
  evaluateConditions,
  failedConditions,
  type FactMap,
} from "./conditions";
export {
  inverseAction,
  buildExecutionPlan,
  buildRollbackPlan,
  isFullyReversible,
  type PlanDeps,
} from "./execution-plan";
export { factsFromSignal, buildProposal, planFromSignals, type PlannerDeps } from "./planner";
export { canTransition, transition, initialState, isExecutable, isTerminal } from "./approval";
export {
  executePlan,
  verifyPlan,
  rollbackPlan,
  type ActionRunner,
  type FactReader,
  type ExecuteOptions,
} from "./execution";
export { resolvePolicy, trustableAutomations, type PolicyDecision } from "./policy";
export { appendAudit, buildAuditTrail, computeAnalytics, type ExecutionRecord } from "./audit";
export {
  pendingProposals,
  activeProposals,
  completedProposals,
  trustedProposals,
  chiefProposals,
  proposalCounts,
} from "./selectors";
export {
  policySchema,
  proposalActionSchema,
  setPolicySchema,
  proposalStateSchema,
} from "./schemas";
