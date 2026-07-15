/**
 * Task domain constants (Sprint 2.5). Tasks are the canonical work model of My OS
 * — deterministic, single-user, offline-friendly. No AI, no randomness.
 */

export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "completed",
  "archived",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Statuses that count as "open" work (not done, not archived). */
export const OPEN_STATUSES: TaskStatus[] = ["not_started", "in_progress", "blocked"];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Weight used for sorting — higher sorts first. */
export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

/** Default estimate applied when the parser can't infer one but a task is created. */
export const DEFAULT_ESTIMATE_MINUTES = 30;

/** Minutes between scheduled blocks (breathing room). */
export const SCHEDULE_GAP_MINUTES = 0;

/** Named inputs the engine cites (mirrors the decision engine convention). */
export const TASK_LABEL_COLORS = ["gray", "red", "amber", "green", "blue", "violet"] as const;
export type TaskLabelColor = (typeof TASK_LABEL_COLORS)[number];
