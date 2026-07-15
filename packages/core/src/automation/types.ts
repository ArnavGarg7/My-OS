import type {
  ActionKind,
  AutomationPriority,
  AutomationStatus,
  ConditionCombinator,
  ConditionOperator,
  ExecutionOutcome,
  ExecutionPolicy,
  ScheduleDecision,
  TimeCondition,
  TriggerKind,
} from "./constants";

/**
 * Automation engine types (Sprint 3.4). An automation is a deterministic rule:
 * Trigger → Conditions → Actions → Execution Policy. It references modules' signals
 * and services but owns only its own execution state.
 */

/** A trigger event supplied by a feature module (reuses existing signal models). */
export interface TriggerEvent {
  id: string;
  kind: TriggerKind;
  /** The specific signal name, e.g. "planner.generated", "focus.completed". */
  event: string;
  source: string;
  timestamp: string; // ISO
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

/** A single leaf condition. */
export interface Condition {
  id: string;
  /** Dot-path into the trigger payload/context, e.g. "task.completed". */
  field: string;
  operator: ConditionOperator;
  /** Comparison value (or [min,max] for between, ISO for before/after). */
  value: unknown;
  /** Optional named time window, evaluated against the execution context. */
  timeCondition?: TimeCondition;
}

/** A composable condition group. */
export interface ConditionGroup {
  combinator: ConditionCombinator;
  conditions: (Condition | ConditionGroup)[];
}

/** A single action referencing an existing service. */
export interface Action {
  id: string;
  kind: ActionKind;
  /** Parameters passed to the target service (deterministic, serialisable). */
  params: Record<string, unknown>;
  order: number;
}

/** Execution policy configuration. */
export interface ExecutionPolicyConfig {
  policy: ExecutionPolicy;
  cooldownMinutes?: number;
  throttleMinutes?: number;
  maxExecutions?: number;
  retryAttempts?: number;
  retryBackoffMinutes?: number;
  delayMinutes?: number;
  /** For schedule policy: cron-lite local HH:MM the rule may run at. */
  scheduleAt?: string;
}

/** A full automation rule. */
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  priority: AutomationPriority;
  trigger: { kind: TriggerKind; event: string };
  conditions: ConditionGroup;
  actions: Action[];
  policy: ExecutionPolicyConfig;
  /** Whether this rule ships with the engine (editable but not deletable). */
  builtIn: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** A draft for creating/updating a rule. Optional fields tolerate `undefined` (zod). */
export interface AutomationDraft {
  name: string;
  description?: string | undefined;
  priority?: AutomationPriority | undefined;
  trigger: { kind: TriggerKind; event: string };
  conditions?: ConditionGroup | undefined;
  actions: Action[];
  policy?: ExecutionPolicyConfig | undefined;
  builtIn?: boolean | undefined;
}

/** A history record of one execution attempt. */
export interface ExecutionRecord {
  id: string;
  ruleId: string;
  outcome: ExecutionOutcome;
  triggeredAt: string; // ISO
  completedAt: string | null;
  /** Runtime in milliseconds (completedAt − triggeredAt), when known. */
  runtimeMs: number | null;
  /** Which actions ran + their per-action result. */
  actionResults: { actionId: string; kind: ActionKind; ok: boolean; detail?: string }[];
  error: string | null;
}

/** The scheduler's decision for a rule at a given `now`. */
export interface AutomationScheduleResult {
  decision: ScheduleDecision;
  runAt: string | null; // ISO — when it should run (delay/retry/cooldown)
  reason: string;
}

/** Derived statistics for a rule (never stored redundantly). */
export interface AutomationStatistics {
  ruleId: string;
  executions: number;
  successes: number;
  failures: number;
  skipped: number;
  averageRuntimeMs: number;
  failureRate: number; // 0–100
  lastRunAt: string | null;
  lastOutcome: ExecutionOutcome | null;
}

/** Portfolio-level statistics across all rules. */
export interface AutomationPortfolio {
  totalRules: number;
  enabledRules: number;
  executionsToday: number;
  successesToday: number;
  failuresToday: number;
  pendingApprovals: number;
  mostTriggeredRuleId: string | null;
  mostSuccessfulRuleId: string | null;
}

/** A dry-run preview of what an automation would do (no execution). */
export interface AutomationPreview {
  triggerMatches: boolean;
  conditionsPass: boolean;
  wouldExecute: boolean;
  actions: { kind: ActionKind; summary: string }[];
  expectedResult: string;
  reason: string;
}

/** Deterministic signals surfaced to the Decision engine. */
export interface AutomationSignals {
  enabledRules: number;
  failuresToday: number;
  pendingApprovals: number;
  runawayRule: boolean; // a rule executed suspiciously many times today
}

/** Compact summary for status bar / context panel / Morning / Tomorrow. */
export interface AutomationSummary {
  enabledRules: number;
  runningNow: number;
  pending: number;
  failedToday: number;
  executedToday: number;
}

/** The context in which conditions + scheduler are evaluated. */
export interface AutomationContext {
  now: Date;
  timezone: string;
  workingHours: { start: string; end: string };
  quietHours: { enabled: boolean; start: string; end: string };
  focusSessionActive: boolean;
  plannerGenerated: boolean;
}
