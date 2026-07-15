/**
 * Analytics foundation (Sprint 2.8.5). Every engine emits a `MetricEvent` so the
 * Sprint 2.14 Analytics page is mostly visualization. Pure, deterministic types.
 */
export const METRIC_KINDS = [
  "decision.accepted",
  "decision.dismissed",
  "task.completed",
  "task.created",
  "milestone.completed",
  "meeting.finished",
  "planner.accepted",
  "planner.accuracy",
  "workout.logged",
  "journal.created",
  "reflection.completed",
  "gratitude.logged",
  "mood.average",
  "finance.expense",
  "finance.income",
  "budget.usage",
  "subscription.cost",
  "savings.progress",
  "goal.progress",
  "habit.streak",
  "objective.progress",
  "goal.review",
  "forecast.accuracy",
  "focus.minutes",
  "deep_work.minutes",
  "focus.interruptions",
  "focus.session_length",
  "focus.completion_rate",
  "notifications.generated",
  "notifications.dismissed",
  "notifications.completed",
  "notifications.snoozed",
  "notifications.response_time",
  "automation.executions",
  "automation.success",
  "automation.failure",
  "automation.skipped",
  "automation.runtime",
  "orchestration.runtime",
  "orchestration.failures",
  "orchestration.recoveries",
  "orchestration.pipeline.executions",
  "orchestration.pipeline.skipped",
] as const;
export type MetricKind = (typeof METRIC_KINDS)[number];

export interface MetricEvent {
  id: string;
  kind: MetricKind;
  /** Numeric magnitude (default 1 for counters; a ratio/percent for gauges). */
  value: number;
  at: string; // ISO timestamp
  meta?: Record<string, unknown>;
}

export type MetricInput = {
  kind: MetricKind;
  value?: number;
  at?: string;
  meta?: Record<string, unknown>;
};
