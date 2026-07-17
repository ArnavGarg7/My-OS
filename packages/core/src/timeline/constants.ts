/**
 * Timeline engine constants (Sprint 2.13). The Timeline is a deterministic,
 * append-only, immutable read model aggregating events from every module. No AI.
 * These tables drive importance scoring, memory promotion and grouping — all
 * pure data so behaviour is reproducible and testable.
 */

/** Every module that can contribute events (05 DB enum `timeline_source`). */
export const TIMELINE_SOURCES = [
  "today",
  "decision",
  "planner",
  "calendar",
  "task",
  "project",
  "goal",
  "journal",
  "health",
  "finance",
  "inbox",
  "automation",
  "orchestration",
  "knowledge",
  "life",
  "resource",
  "dashboard",
  "ai",
] as const;
export type TimelineSource = (typeof TIMELINE_SOURCES)[number];

/** Pinned-memory categories (DB enum `memory_type`). */
export const MEMORY_TYPES = [
  "achievement",
  "milestone",
  "reflection",
  "health",
  "finance",
  "learning",
  "personal",
] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];

/** Snapshot periods (DB enum `snapshot_type`). */
export const SNAPSHOT_TYPES = ["week", "month", "quarter", "year"] as const;
export type SnapshotType = (typeof SNAPSHOT_TYPES)[number];

/** Grouping granularities for the feed. */
export const GROUPINGS = ["hour", "day", "week", "month", "year"] as const;
export type Grouping = (typeof GROUPINGS)[number];

/** Importance is a 0–100 score; named bands keep rules readable. */
export const IMPORTANCE = {
  trivial: 10,
  minor: 30,
  normal: 50,
  notable: 70,
  major: 85,
  milestone: 100,
} as const;

/** Default importance when an event type is unknown. */
export const DEFAULT_IMPORTANCE = 40;

/** Base importance per known event type (deterministic scoring). */
export const EVENT_IMPORTANCE: Record<string, number> = {
  "goal.created": IMPORTANCE.normal,
  "goal.completed": IMPORTANCE.milestone,
  "goal.review_completed": IMPORTANCE.notable,
  "objective.completed": IMPORTANCE.major,
  "habit.completed": IMPORTANCE.minor,
  "project.created": IMPORTANCE.normal,
  "project.completed": IMPORTANCE.milestone,
  "milestone.completed": IMPORTANCE.major,
  "task.created": IMPORTANCE.trivial + 10,
  "task.completed": IMPORTANCE.minor + 10,
  "decision.accepted": IMPORTANCE.normal,
  "decision.dismissed": IMPORTANCE.minor - 10,
  "planner.accepted": IMPORTANCE.minor + 10,
  "calendar.meeting_finished": IMPORTANCE.minor,
  "inbox.captured": IMPORTANCE.trivial + 5,
  "health.logged": IMPORTANCE.minor,
  "health.milestone": IMPORTANCE.major,
  "journal.created": IMPORTANCE.normal - 5,
  "reflection.completed": IMPORTANCE.notable - 15,
  "gratitude.logged": IMPORTANCE.minor + 5,
  "review.completed": IMPORTANCE.notable - 10,
  "finance.transaction": IMPORTANCE.minor - 5,
  "budget.updated": IMPORTANCE.minor,
  "subscription.paid": IMPORTANCE.trivial + 10,
  "saving.completed": IMPORTANCE.major + 5,
};

/** Events at or above this importance are auto-promoted to memories. */
export const MEMORY_PROMOTION_THRESHOLD = IMPORTANCE.major;

/** Explicit event-type → memory-type promotions (rule-based, not learned). */
export const MEMORY_TYPE_BY_EVENT: Record<string, MemoryType> = {
  "goal.completed": "achievement",
  "project.completed": "achievement",
  "objective.completed": "milestone",
  "milestone.completed": "milestone",
  "saving.completed": "finance",
  "budget.updated": "finance",
  "health.milestone": "health",
  "reflection.completed": "reflection",
  "review.completed": "reflection",
  "goal.review_completed": "reflection",
  "journal.created": "personal",
  "gratitude.logged": "personal",
};

/** Fallback memory type when an event promotes on importance alone. */
export const DEFAULT_MEMORY_TYPE: MemoryType = "milestone";

/** Highlight categories the engine can produce (deterministic). */
export const HIGHLIGHT_CATEGORIES = [
  "biggest_achievement",
  "longest_focus_block",
  "most_productive_day",
  "biggest_spending_day",
  "best_workout",
  "largest_journal_streak",
] as const;
export type HighlightCategory = (typeof HIGHLIGHT_CATEGORIES)[number];

/** Feed page size default. */
export const DEFAULT_FEED_LIMIT = 50;
