/**
 * Proposal-First Automation Engine — types (Sprint 6.3, Phase 6). The deterministic layer that turns
 * Signals + Prediction Signals into executable **proposals** the user reviews, approves, and — for
 * explicitly-trusted low-risk cases — lets run. Pure: no IO, no clock (time injected), no AI. The AI
 * never executes; it only explains. Every mutation is intentional, reversible, verified and audited.
 *
 * Pipeline: signals + predictions → planner → execution plan → proposal → approval → execution →
 * verification → (rollback on failure) → audit → timeline.
 */

/** What fires an automation (spec §Trigger Engine). Phase 6.3 covers the deterministic ones. */
export type TriggerKind =
  | "signal_created"
  | "prediction_created"
  | "time_window"
  | "calendar_change"
  | "goal_drift"
  | "task_completion"
  | "project_delay"
  | "manual";

/** How risky an automation's effect is — governs the default policy. */
export type RiskLevel = "low" | "medium" | "high";

/** Governance for whether an automation may run without a fresh approval (spec §Policy Engine). */
export type Policy = "always_ask" | "ask_once" | "trusted" | "disabled";

/** A single verb the execution engine can perform. Every action is reversible + verifiable. */
export type ActionKind =
  | "acknowledge_signal"
  | "dismiss_expired_signal"
  | "mark_stale_opportunity"
  | "refresh_prediction_cache"
  | "refresh_dashboard"
  | "archive_completed_notification";

/** An action descriptor inside an automation/plan. Parameters are structured, never free text. */
export interface Action {
  kind: ActionKind;
  /** Human label for the plan/audit. */
  label: string;
  /** Structured parameters the server handler consumes. */
  params: Record<string, unknown>;
  /** Whether this action mutates state (⇒ requires a rollback path). */
  mutating: boolean;
}

/** A registered automation. Immutable after registration. */
export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: TriggerKind;
  /** Conditions (ALL must hold) — evaluated against a context. */
  conditions: AutomationCondition[];
  actions: Action[];
  /** Whether a rollback path exists (required for any mutating automation). */
  reversible: boolean;
  permissions: string[];
  risk: RiskLevel;
  category: string;
  version: string;
  status: "active" | "retired";
  /** The default policy (a user may override per automation). */
  defaultPolicy: Policy;
}

/** A boolean condition over the planning context (spec §Condition Engine). */
export interface AutomationCondition {
  /** A named fact in the context, e.g. "signal.category". */
  fact: string;
  op: "eq" | "neq" | "gte" | "lte" | "exists" | "in";
  value?: unknown;
}

/** The lifecycle of a proposal/execution (spec §Approval Workflow). No hidden transitions. */
export type AutomationState =
  | "draft"
  | "ready"
  | "pending_approval"
  | "approved"
  | "executing"
  | "completed"
  | "rejected"
  | "failed"
  | "rolled_back";

/** A proposal — the reviewable unit. Nothing executes until it is approved (or trusted). */
export interface Proposal {
  id: string;
  automationId: string;
  title: string;
  /** Why this was proposed (grounded in the triggering signal/prediction). */
  reason: string;
  /** The expected benefit, e.g. "+90 minutes focus". */
  expectedBenefit: string;
  risk: RiskLevel;
  /** Summary of what would be undone on rollback. */
  rollbackSummary: string;
  plan: ExecutionPlan;
  policy: Policy;
  state: AutomationState;
  /** Source that produced it (signal/prediction id) — for grounding + replay. */
  source: { kind: "signal" | "prediction" | "manual"; id: string } | null;
  createdAt: string;
}

/** A deterministic, immutable, ordered execution plan (spec §Execution Planner). */
export interface ExecutionPlan {
  id: string;
  steps: ExecutionStep[];
  /** The verification checks run after the steps. */
  verifications: VerificationCheck[];
}

export interface ExecutionStep {
  order: number;
  action: Action;
  /** The inverse action used to roll this step back (present iff the action mutates). */
  rollback: Action | null;
}

/** A post-condition to confirm before marking complete (spec §Verification Engine). */
export interface VerificationCheck {
  label: string;
  /** The fact to read after execution. */
  fact: string;
  /** The value it must equal for success. */
  expected: unknown;
}

/** The result of running one step (recorded immutably). */
export interface StepResult {
  order: number;
  actionKind: ActionKind;
  ok: boolean;
  detail: string;
  /** Whether this step was a no-op because already applied (idempotency). */
  idempotentSkip: boolean;
}

/** The result of verifying the execution. */
export interface VerificationResult {
  passed: boolean;
  checks: { label: string; ok: boolean; expected: unknown; actual: unknown }[];
}

/** One entry in an automation's immutable audit timeline (spec §Audit Trail). */
export interface AuditEvent {
  at: string;
  state:
    | AutomationState
    | "proposal_created"
    | "approved"
    | "verification_passed"
    | "verification_failed";
  detail: string;
}

/** Aggregate automation analytics (spec §Automation Analytics). */
export interface AutomationAnalytics {
  proposals: number;
  approved: number;
  executed: number;
  rolledBack: number;
  failed: number;
  approvalRate: number;
  executionSuccessRate: number;
  rollbackRate: number;
  trustedUsage: number;
}
