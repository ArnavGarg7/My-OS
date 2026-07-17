import type { MetricKind } from "./types";

/**
 * Analytics registry (Sprint 2.8.5). Describes each metric kind — label, unit
 * and whether it is a counter or a gauge — so Sprint 2.14 renders uniformly.
 */
export interface MetricDescriptor {
  kind: MetricKind;
  label: string;
  unit: "count" | "percent" | "minutes";
  type: "counter" | "gauge";
}

export const METRIC_REGISTRY: Record<MetricKind, MetricDescriptor> = {
  "decision.accepted": {
    kind: "decision.accepted",
    label: "Decisions accepted",
    unit: "count",
    type: "counter",
  },
  "decision.dismissed": {
    kind: "decision.dismissed",
    label: "Decisions dismissed",
    unit: "count",
    type: "counter",
  },
  "task.completed": {
    kind: "task.completed",
    label: "Tasks completed",
    unit: "count",
    type: "counter",
  },
  "task.created": { kind: "task.created", label: "Tasks created", unit: "count", type: "counter" },
  "milestone.completed": {
    kind: "milestone.completed",
    label: "Milestones completed",
    unit: "count",
    type: "counter",
  },
  "meeting.finished": {
    kind: "meeting.finished",
    label: "Meetings finished",
    unit: "count",
    type: "counter",
  },
  "planner.accepted": {
    kind: "planner.accepted",
    label: "Plans accepted",
    unit: "count",
    type: "counter",
  },
  "planner.accuracy": {
    kind: "planner.accuracy",
    label: "Planner accuracy",
    unit: "percent",
    type: "gauge",
  },
  "workout.logged": {
    kind: "workout.logged",
    label: "Workouts logged",
    unit: "count",
    type: "counter",
  },
  "journal.created": {
    kind: "journal.created",
    label: "Journal entries",
    unit: "count",
    type: "counter",
  },
  "reflection.completed": {
    kind: "reflection.completed",
    label: "Reflections completed",
    unit: "count",
    type: "counter",
  },
  "gratitude.logged": {
    kind: "gratitude.logged",
    label: "Gratitude logged",
    unit: "count",
    type: "counter",
  },
  "mood.average": { kind: "mood.average", label: "Average mood", unit: "count", type: "gauge" },
  "finance.expense": { kind: "finance.expense", label: "Expenses", unit: "count", type: "counter" },
  "finance.income": { kind: "finance.income", label: "Income", unit: "count", type: "counter" },
  "budget.usage": { kind: "budget.usage", label: "Budget usage", unit: "percent", type: "gauge" },
  "subscription.cost": {
    kind: "subscription.cost",
    label: "Subscription cost",
    unit: "count",
    type: "gauge",
  },
  "savings.progress": {
    kind: "savings.progress",
    label: "Savings progress",
    unit: "percent",
    type: "gauge",
  },
  "goal.progress": {
    kind: "goal.progress",
    label: "Goal progress",
    unit: "percent",
    type: "gauge",
  },
  "habit.streak": { kind: "habit.streak", label: "Habit streak", unit: "count", type: "gauge" },
  "objective.progress": {
    kind: "objective.progress",
    label: "Objective progress",
    unit: "percent",
    type: "gauge",
  },
  "goal.review": { kind: "goal.review", label: "Goal reviews", unit: "count", type: "counter" },
  "forecast.accuracy": {
    kind: "forecast.accuracy",
    label: "Forecast accuracy",
    unit: "percent",
    type: "gauge",
  },
  "focus.minutes": {
    kind: "focus.minutes",
    label: "Focus minutes",
    unit: "minutes",
    type: "counter",
  },
  "deep_work.minutes": {
    kind: "deep_work.minutes",
    label: "Deep work minutes",
    unit: "minutes",
    type: "counter",
  },
  "focus.interruptions": {
    kind: "focus.interruptions",
    label: "Interruptions",
    unit: "count",
    type: "counter",
  },
  "focus.session_length": {
    kind: "focus.session_length",
    label: "Session length",
    unit: "minutes",
    type: "gauge",
  },
  "focus.completion_rate": {
    kind: "focus.completion_rate",
    label: "Focus completion rate",
    unit: "percent",
    type: "gauge",
  },
  "notifications.generated": {
    kind: "notifications.generated",
    label: "Notifications generated",
    unit: "count",
    type: "counter",
  },
  "notifications.dismissed": {
    kind: "notifications.dismissed",
    label: "Notifications dismissed",
    unit: "count",
    type: "counter",
  },
  "notifications.completed": {
    kind: "notifications.completed",
    label: "Notifications completed",
    unit: "count",
    type: "counter",
  },
  "notifications.snoozed": {
    kind: "notifications.snoozed",
    label: "Notifications snoozed",
    unit: "count",
    type: "counter",
  },
  "notifications.response_time": {
    kind: "notifications.response_time",
    label: "Notification response time",
    unit: "minutes",
    type: "gauge",
  },
  "automation.executions": {
    kind: "automation.executions",
    label: "Automation executions",
    unit: "count",
    type: "counter",
  },
  "automation.success": {
    kind: "automation.success",
    label: "Automation successes",
    unit: "count",
    type: "counter",
  },
  "automation.failure": {
    kind: "automation.failure",
    label: "Automation failures",
    unit: "count",
    type: "counter",
  },
  "automation.skipped": {
    kind: "automation.skipped",
    label: "Automation skipped",
    unit: "count",
    type: "counter",
  },
  "automation.runtime": {
    kind: "automation.runtime",
    label: "Automation runtime",
    unit: "minutes",
    type: "gauge",
  },
  "orchestration.runtime": {
    kind: "orchestration.runtime",
    label: "Orchestration runtime",
    unit: "minutes",
    type: "gauge",
  },
  "orchestration.failures": {
    kind: "orchestration.failures",
    label: "Orchestration failures",
    unit: "count",
    type: "counter",
  },
  "orchestration.recoveries": {
    kind: "orchestration.recoveries",
    label: "Orchestration recoveries",
    unit: "count",
    type: "counter",
  },
  "orchestration.pipeline.executions": {
    kind: "orchestration.pipeline.executions",
    label: "Pipeline executions",
    unit: "count",
    type: "counter",
  },
  "orchestration.pipeline.skipped": {
    kind: "orchestration.pipeline.skipped",
    label: "Pipeline steps skipped",
    unit: "count",
    type: "counter",
  },
  "knowledge.notes": {
    kind: "knowledge.notes",
    label: "Notes created",
    unit: "count",
    type: "counter",
  },
  "knowledge.flashcards_reviewed": {
    kind: "knowledge.flashcards_reviewed",
    label: "Flashcards reviewed",
    unit: "count",
    type: "counter",
  },
  "knowledge.learning_hours": {
    kind: "knowledge.learning_hours",
    label: "Learning hours",
    unit: "minutes",
    type: "gauge",
  },
  "knowledge.reading_velocity": {
    kind: "knowledge.reading_velocity",
    label: "Reading velocity",
    unit: "count",
    type: "gauge",
  },
  "life.habit_consistency": {
    kind: "life.habit_consistency",
    label: "Habit consistency",
    unit: "percent",
    type: "gauge",
  },
  "life.routine_adherence": {
    kind: "life.routine_adherence",
    label: "Routine adherence",
    unit: "percent",
    type: "gauge",
  },
  "life.workout_load": {
    kind: "life.workout_load",
    label: "Workout load",
    unit: "count",
    type: "gauge",
  },
  "life.recovery": { kind: "life.recovery", label: "Recovery", unit: "percent", type: "gauge" },
  "life.growth_velocity": {
    kind: "life.growth_velocity",
    label: "Growth velocity",
    unit: "percent",
    type: "gauge",
  },
  "life.life_balance": {
    kind: "life.life_balance",
    label: "Life balance",
    unit: "percent",
    type: "gauge",
  },
  "life.identity_progress": {
    kind: "life.identity_progress",
    label: "Identity progress",
    unit: "percent",
    type: "gauge",
  },
  "resource.net_worth": {
    kind: "resource.net_worth",
    label: "Net worth",
    unit: "count",
    type: "gauge",
  },
  "resource.relationship_activity": {
    kind: "resource.relationship_activity",
    label: "Relationship activity",
    unit: "count",
    type: "counter",
  },
  "resource.maintenance_completion": {
    kind: "resource.maintenance_completion",
    label: "Maintenance completion",
    unit: "percent",
    type: "gauge",
  },
  "resource.investment_allocation": {
    kind: "resource.investment_allocation",
    label: "Investment allocation",
    unit: "percent",
    type: "gauge",
  },
  "resource.insurance_coverage": {
    kind: "resource.insurance_coverage",
    label: "Insurance coverage",
    unit: "count",
    type: "gauge",
  },
  "resource.document_health": {
    kind: "resource.document_health",
    label: "Document health",
    unit: "percent",
    type: "gauge",
  },
  "dashboard.overall": {
    kind: "dashboard.overall",
    label: "Overall life score",
    unit: "percent",
    type: "gauge",
  },
  "dashboard.life_balance": {
    kind: "dashboard.life_balance",
    label: "Life balance",
    unit: "percent",
    type: "gauge",
  },
  "dashboard.attention": {
    kind: "dashboard.attention",
    label: "Attention items",
    unit: "count",
    type: "counter",
  },
};

export function describeMetric(kind: MetricKind): MetricDescriptor {
  return METRIC_REGISTRY[kind];
}
