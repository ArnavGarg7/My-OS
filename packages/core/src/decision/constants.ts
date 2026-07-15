/**
 * Decision engine constants (Sprint 2.3). Deterministic — no randomness, no AI.
 */

export const DECISION_STATES = [
  "pending",
  "accepted",
  "dismissed",
  "deferred",
  "expired",
  "completed",
] as const;
export type DecisionState = (typeof DECISION_STATES)[number];

export const DECISION_TYPES = [
  "mission",
  "focus",
  "planner",
  "health",
  "workout",
  "sleep",
  "hydration",
  "college",
  "internship",
  "project",
  "finance",
  "goal",
  "journal",
  "system",
] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

export const DECISION_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type DecisionPriority = (typeof DECISION_PRIORITIES)[number];

/** Base score contributed by a decision's priority (0–100 scoring). */
export const PRIORITY_WEIGHT: Record<DecisionPriority, number> = {
  critical: 90,
  high: 70,
  medium: 50,
  low: 30,
};

/** Ranking order — lower rank sorts first. */
export const PRIORITY_RANK: Record<DecisionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const DEFER_OPTIONS = ["15m", "30m", "1h", "tomorrow", "custom"] as const;
export type DeferOption = (typeof DEFER_OPTIONS)[number];

export const DEFER_MINUTES: Record<"15m" | "30m" | "1h", number> = {
  "15m": 15,
  "30m": 30,
  "1h": 60,
};

/** A dismissed decision must not resurface for this long. */
export const DISMISS_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

/** Default lifetime of a generated decision. */
export const DEFAULT_EXPIRY_MINUTES = 120;

/** Above this many unprocessed inbox items, suggest processing the Inbox (Sprint 2.4). */
export const INBOX_OVERFLOW_THRESHOLD = 10;

/** Named inputs the engine may cite in explanations. */
export const DECISION_INPUTS = [
  "Time",
  "Mission",
  "Energy",
  "Planner",
  "Focus",
  "Metrics",
  "Sleep",
  "Inbox",
] as const;
