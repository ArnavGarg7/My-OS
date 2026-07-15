/**
 * Planner constants (Sprint 2.6). The Planner is the orchestration layer — it
 * turns Today + Decision + Task inputs into a deterministic timeline. No AI, no
 * randomness. Every value here is a fixed rule.
 */

export const PLANNER_BLOCK_TYPES = [
  "focus",
  "meeting",
  "task",
  "break",
  "buffer",
  "overflow",
] as const;
export type PlannerBlockType = (typeof PLANNER_BLOCK_TYPES)[number];

export const PLANNER_STATUSES = ["empty", "generated", "optimized"] as const;
export type PlannerStatus = (typeof PLANNER_STATUSES)[number];

/** Where a block came from (derived, not stored as a column). */
export const BLOCK_SOURCES = ["task", "decision", "manual", "generated"] as const;
export type BlockSource = (typeof BLOCK_SOURCES)[number];

export const CONFLICT_TYPES = [
  "overlap",
  "impossible",
  "dependency-violation",
  "overdue",
  "insufficient-hours",
] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const PLANNER_ACTIONS = [
  "generate",
  "regenerate",
  "optimize",
  "lock",
  "unlock",
  "move",
  "clear",
] as const;
export type PlannerAction = (typeof PLANNER_ACTIONS)[number];

/** Default estimate for a task with no duration (mirrors the task engine). */
export const DEFAULT_TASK_MINUTES = 30;

/** Standard break inserted mid-day. */
export const LUNCH_TIME = "13:00";
export const LUNCH_MINUTES = 60;

/** Buffer reserved after meetings. */
export const BUFFER_MINUTES = 15;

/** Gaps smaller than this are closed during optimization. */
export const MIN_GAP_MERGE_MINUTES = 15;

/** A move nudges a block by this many minutes. */
export const MOVE_STEP_MINUTES = 30;
