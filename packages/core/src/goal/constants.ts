/**
 * Goal domain constants (Sprint 2.12). The strategic layer of My OS — life goals,
 * objectives, key results and habits measuring whether outcomes advance your
 * life. Goals are outcomes, not work. No AI, no randomness, fully deterministic.
 */

export const GOAL_TYPES = ["life", "career", "education", "health", "finance", "personal"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_STATUSES = ["planned", "active", "paused", "completed", "archived"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

/** Statuses that count as "open" (contributing to active counts). */
export const OPEN_GOAL_STATUSES: GoalStatus[] = ["planned", "active", "paused"];

export const GOAL_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export const PRIORITY_WEIGHT: Record<GoalPriority, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export const REVIEW_PERIODS = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type ReviewPeriod = (typeof REVIEW_PERIODS)[number];

export const HABIT_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

/** How a key result is measured. */
export const METRIC_TYPES = ["numeric", "percentage", "boolean", "milestone"] as const;
export type MetricType = (typeof METRIC_TYPES)[number];

export const OBJECTIVE_STATUSES = ["active", "completed"] as const;
export type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];

export const KEY_RESULT_STATUSES = ["active", "completed"] as const;
export type KeyResultStatus = (typeof KEY_RESULT_STATUSES)[number];

/** What a goal may link to (ids only — no data duplication). */
export const GOAL_LINK_TARGETS = [
  "project",
  "task",
  "journal_entry",
  "finance_goal",
  "health_metric",
] as const;
export type GoalLinkTarget = (typeof GOAL_LINK_TARGETS)[number];

/** Progress weighting when a goal derives from objectives + habits. */
export const PROGRESS_WEIGHTS = { objectives: 0.7, habits: 0.3 } as const;

/** A goal counts as "at risk" below this pace ratio vs elapsed time. */
export const BEHIND_PACE_RATIO = 0.8;
export const AHEAD_PACE_RATIO = 1.15;

/** A streak is "about to break" when the last completion is this many periods old. */
export const STREAK_AT_RISK_DAYS = 1;

/** Days before a quarter ends to prompt a quarterly review. */
export const QUARTER_REVIEW_WINDOW_DAYS = 7;

/** Rolling window (days) for habit consistency + goal velocity. */
export const CONSISTENCY_WINDOW_DAYS = 30;
