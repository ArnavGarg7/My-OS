/**
 * Timeline foundation (Sprint 2.8.5). A cross-engine activity stream. Every
 * engine emits `TimelineEvent`s so Sprint 2.13's Timeline page is mostly UI.
 * Pure, deterministic types — no React, no persistence yet.
 */
export const TIMELINE_SOURCES = [
  "decision",
  "task",
  "project",
  "planner",
  "calendar",
  "inbox",
  "morning",
  "health",
  "journal",
  "finance",
  "goal",
  "focus",
  "notification",
  "automation",
  "orchestration",
  "knowledge",
  "life",
  "resource",
  "dashboard",
] as const;
export type TimelineSource = (typeof TIMELINE_SOURCES)[number];

export const TIMELINE_KINDS = [
  "decision.accepted",
  "decision.dismissed",
  "task.created",
  "task.completed",
  "milestone.completed",
  "project.created",
  "planner.accepted",
  "calendar.meeting_finished",
  "inbox.captured",
  "health.logged",
  "journal.created",
  "reflection.completed",
  "gratitude.logged",
  "review.completed",
  "finance.transaction",
  "budget.updated",
  "subscription.paid",
  "saving.completed",
  "goal.created",
  "goal.completed",
  "habit.completed",
  "objective.completed",
  "goal.review_completed",
  "focus.started",
  "focus.completed",
  "focus.paused",
  "focus.break",
  "focus.interruption",
  "notification.generated",
  "notification.delivered",
  "notification.dismissed",
  "notification.completed",
  "notification.snoozed",
  "automation.executed",
  "automation.failed",
  "automation.skipped",
  "automation.created",
  "automation.updated",
  "orchestration.started",
  "orchestration.completed",
  "orchestration.failed",
  "orchestration.recovered",
  "orchestration.previewed",
  "note.created",
  "wiki.created",
  "book.finished",
  "course.completed",
  "research.created",
  "flashcard.reviewed",
  "life_habit.completed",
  "routine.completed",
  "workout.completed",
  "medication.logged",
  "appointment.completed",
  "injury.logged",
  "personal_review.completed",
  "investment.updated",
  "asset.added",
  "maintenance.completed",
  "document.renewed",
  "relationship.created",
  "interaction.logged",
  "birthday",
  "insurance.renewed",
  "review.generated",
  "report.generated",
  "milestone.reached",
  "achievement.unlocked",
] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  source: TimelineSource;
  title: string;
  at: string; // ISO timestamp
  meta?: Record<string, unknown>;
}

/** What a caller supplies to emit — id + timestamp are filled by the emitter. */
export type TimelineInput = Omit<TimelineEvent, "id" | "at"> & { at?: string };
