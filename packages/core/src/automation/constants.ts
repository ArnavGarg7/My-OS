/**
 * Automation engine constants (Sprint 3.4). The Automation Engine is a PLATFORM
 * engine (like Timeline/Analytics/Notification/Decision) — it holds NO feature logic.
 * Feature modules expose signals (triggers); automation owns execution. An automation
 * is Trigger → Conditions → Actions → Execution Policy. Fully deterministic — every
 * threshold lives here. No AI, no randomness, no timers.
 */

/** What can fire an automation. Reuses the existing signal sources — no duplicates. */
export const TRIGGER_KINDS = [
  "planner",
  "task",
  "focus",
  "calendar",
  "notification",
  "health",
  "journal",
  "finance",
  "goals",
  "projects",
  "timeline",
  "analytics",
  "tomorrow",
  "morning",
  "inbox",
  "manual",
  "time",
] as const;
export type TriggerKind = (typeof TRIGGER_KINDS)[number];

/** Deterministic condition operators. All composable via AND/OR/NOT groups. */
export const CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "contains",
  "exists",
  "missing",
  "between",
  "before",
  "after",
] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

/** Boolean combinators for condition groups. */
export const CONDITION_COMBINATORS = ["and", "or", "not"] as const;
export type ConditionCombinator = (typeof CONDITION_COMBINATORS)[number];

/** Named time windows resolved against existing engines (never recomputed here). */
export const TIME_CONDITIONS = [
  "working_hours",
  "weekend",
  "weekday",
  "morning",
  "afternoon",
  "evening",
  "night",
  "quiet_hours",
  "focus_session_active",
  "planner_generated",
] as const;
export type TimeCondition = (typeof TIME_CONDITIONS)[number];

/** Actions call EXISTING services — automation never implements business logic. */
export const ACTION_KINDS = [
  "generate_notification",
  "start_focus",
  "pause_focus",
  "resume_focus",
  "complete_focus",
  "generate_planner",
  "regenerate_planner",
  "open_tomorrow",
  "mark_decision_complete",
  "generate_decision",
  "dismiss_decision",
  "open_journal",
  "log_timeline_event",
  "emit_analytics_event",
  "create_reminder",
  "complete_reminder",
  "run_custom_workflow",
  "noop",
] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];

/** How often / under what policy an automation runs. */
export const EXECUTION_POLICIES = [
  "run_once",
  "run_always",
  "cooldown",
  "throttle",
  "max_executions",
  "retry",
  "delay",
  "schedule",
  "manual_approval",
] as const;
export type ExecutionPolicy = (typeof EXECUTION_POLICIES)[number];

/** Automation lifecycle status (DB enum `automation_status`). */
export const AUTOMATION_STATUSES = ["created", "enabled", "disabled", "archived"] as const;
export type AutomationStatus = (typeof AUTOMATION_STATUSES)[number];

/** Per-execution outcome (recorded in history). */
export const EXECUTION_OUTCOMES = [
  "triggered",
  "conditions_failed",
  "executing",
  "completed",
  "failed",
  "skipped",
  "cancelled",
  "expired",
  "pending_approval",
] as const;
export type ExecutionOutcome = (typeof EXECUTION_OUTCOMES)[number];

/** The scheduler's decision for whether an automation runs now. */
export const SCHEDULE_DECISIONS = ["run", "delay", "skip", "cooldown", "retry"] as const;
export type ScheduleDecision = (typeof SCHEDULE_DECISIONS)[number];

/** Rule priority — higher runs first when multiple match the same trigger. */
export const AUTOMATION_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type AutomationPriority = (typeof AUTOMATION_PRIORITIES)[number];

export const PRIORITY_RANK: Record<AutomationPriority, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Default cooldown (minutes) when a cooldown policy omits one. */
export const DEFAULT_COOLDOWN_MINUTES = 60;
/** Default throttle window (minutes). */
export const DEFAULT_THROTTLE_MINUTES = 5;
/** Default maximum executions for a max_executions policy. */
export const DEFAULT_MAX_EXECUTIONS = 10;
/** Default retry attempts + backoff (minutes). */
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_RETRY_BACKOFF_MINUTES = 10;
/** Default delay (minutes) for a delay policy. */
export const DEFAULT_DELAY_MINUTES = 5;
/** Maximum action-chain depth checked by validation (recursion guard). */
export const MAX_ACTION_DEPTH = 8;

/** Actions that (re)generate the same trigger source — used by the recursion guard. */
export const SELF_TRIGGERING_ACTIONS: Partial<Record<ActionKind, TriggerKind>> = {
  generate_planner: "planner",
  regenerate_planner: "planner",
  generate_notification: "notification",
  log_timeline_event: "timeline",
  emit_analytics_event: "analytics",
};
