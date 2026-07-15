/**
 * Project domain constants (Sprint 2.8). Projects own long-term outcomes above
 * the execution layer — deterministic, no AI, no randomness.
 */

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const OPEN_PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on_hold"];

export const PROJECT_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export const PRIORITY_WEIGHT: Record<ProjectPriority, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export const PROJECT_HEALTH = ["healthy", "at_risk", "behind", "blocked", "completed"] as const;
export type ProjectHealth = (typeof PROJECT_HEALTH)[number];

export const PROJECT_COLORS = ["gray", "blue", "green", "amber", "red", "violet"] as const;
export type ProjectColor = (typeof PROJECT_COLORS)[number];

/** Progress weighting across the four deterministic inputs. */
export const PROGRESS_WEIGHTS = {
  tasks: 0.4,
  milestones: 0.3,
  objectives: 0.2,
  schedule: 0.1,
} as const;

/** A milestone due within this many days is "critical / upcoming". */
export const UPCOMING_DAYS = 7;

/** Confidence thresholds for the forecast engine. */
export const CONFIDENCE = { high: 80, medium: 50 } as const;

/** Days of buffer to reserve per unit of schedule slip. */
export const BUFFER_RATIO = 0.2;
