import type { TimelineKind, TimelineSource } from "./types";

/**
 * TimelineRegistry (Sprint 2.8.5). Describes each emittable event kind — its
 * source, a human label and an icon slug — so the Sprint 2.13 Timeline page can
 * render every kind uniformly without hard-coding. Pure data.
 */
export interface TimelineKindDescriptor {
  kind: TimelineKind;
  source: TimelineSource;
  label: string;
  icon: string;
}

export const TIMELINE_REGISTRY: Record<TimelineKind, TimelineKindDescriptor> = {
  "decision.accepted": {
    kind: "decision.accepted",
    source: "decision",
    label: "Decision accepted",
    icon: "check-circle",
  },
  "decision.dismissed": {
    kind: "decision.dismissed",
    source: "decision",
    label: "Decision dismissed",
    icon: "x-circle",
  },
  "task.created": { kind: "task.created", source: "task", label: "Task created", icon: "plus" },
  "task.completed": {
    kind: "task.completed",
    source: "task",
    label: "Task completed",
    icon: "check",
  },
  "milestone.completed": {
    kind: "milestone.completed",
    source: "project",
    label: "Milestone completed",
    icon: "flag",
  },
  "project.created": {
    kind: "project.created",
    source: "project",
    label: "Project created",
    icon: "folder",
  },
  "planner.accepted": {
    kind: "planner.accepted",
    source: "planner",
    label: "Plan accepted",
    icon: "calendar-check",
  },
  "calendar.meeting_finished": {
    kind: "calendar.meeting_finished",
    source: "calendar",
    label: "Meeting finished",
    icon: "calendar",
  },
  "inbox.captured": { kind: "inbox.captured", source: "inbox", label: "Captured", icon: "inbox" },
  "health.logged": {
    kind: "health.logged",
    source: "health",
    label: "Health logged",
    icon: "heart-pulse",
  },
  "journal.created": {
    kind: "journal.created",
    source: "journal",
    label: "Journal entry",
    icon: "notebook-pen",
  },
  "reflection.completed": {
    kind: "reflection.completed",
    source: "journal",
    label: "Reflection completed",
    icon: "scroll-text",
  },
  "gratitude.logged": {
    kind: "gratitude.logged",
    source: "journal",
    label: "Gratitude logged",
    icon: "heart",
  },
  "review.completed": {
    kind: "review.completed",
    source: "journal",
    label: "Review completed",
    icon: "book-open",
  },
  "finance.transaction": {
    kind: "finance.transaction",
    source: "finance",
    label: "Transaction",
    icon: "receipt",
  },
  "budget.updated": {
    kind: "budget.updated",
    source: "finance",
    label: "Budget updated",
    icon: "piggy-bank",
  },
  "subscription.paid": {
    kind: "subscription.paid",
    source: "finance",
    label: "Subscription paid",
    icon: "repeat",
  },
  "saving.completed": {
    kind: "saving.completed",
    source: "finance",
    label: "Savings goal reached",
    icon: "target",
  },
  "goal.created": { kind: "goal.created", source: "goal", label: "Goal created", icon: "flag" },
  "goal.completed": {
    kind: "goal.completed",
    source: "goal",
    label: "Goal achieved",
    icon: "trophy",
  },
  "habit.completed": {
    kind: "habit.completed",
    source: "goal",
    label: "Habit completed",
    icon: "flame",
  },
  "objective.completed": {
    kind: "objective.completed",
    source: "goal",
    label: "Objective completed",
    icon: "target",
  },
  "goal.review_completed": {
    kind: "goal.review_completed",
    source: "goal",
    label: "Goal review",
    icon: "clipboard-check",
  },
  "focus.started": { kind: "focus.started", source: "focus", label: "Focus started", icon: "play" },
  "focus.completed": {
    kind: "focus.completed",
    source: "focus",
    label: "Focus completed",
    icon: "check-circle",
  },
  "focus.paused": { kind: "focus.paused", source: "focus", label: "Focus paused", icon: "pause" },
  "focus.break": { kind: "focus.break", source: "focus", label: "Break taken", icon: "coffee" },
  "focus.interruption": {
    kind: "focus.interruption",
    source: "focus",
    label: "Interruption",
    icon: "bell",
  },
  "notification.generated": {
    kind: "notification.generated",
    source: "notification",
    label: "Notification generated",
    icon: "bell",
  },
  "notification.delivered": {
    kind: "notification.delivered",
    source: "notification",
    label: "Notification delivered",
    icon: "bell",
  },
  "notification.dismissed": {
    kind: "notification.dismissed",
    source: "notification",
    label: "Notification dismissed",
    icon: "x-circle",
  },
  "notification.completed": {
    kind: "notification.completed",
    source: "notification",
    label: "Notification completed",
    icon: "check-circle",
  },
  "notification.snoozed": {
    kind: "notification.snoozed",
    source: "notification",
    label: "Notification snoozed",
    icon: "clock",
  },
  "automation.executed": {
    kind: "automation.executed",
    source: "automation",
    label: "Automation executed",
    icon: "zap",
  },
  "automation.failed": {
    kind: "automation.failed",
    source: "automation",
    label: "Automation failed",
    icon: "x-circle",
  },
  "automation.skipped": {
    kind: "automation.skipped",
    source: "automation",
    label: "Automation skipped",
    icon: "skip-forward",
  },
  "automation.created": {
    kind: "automation.created",
    source: "automation",
    label: "Automation created",
    icon: "plus",
  },
  "automation.updated": {
    kind: "automation.updated",
    source: "automation",
    label: "Automation updated",
    icon: "pencil",
  },
  "orchestration.started": {
    kind: "orchestration.started",
    source: "orchestration",
    label: "Orchestration started",
    icon: "workflow",
  },
  "orchestration.completed": {
    kind: "orchestration.completed",
    source: "orchestration",
    label: "Orchestration completed",
    icon: "check-circle",
  },
  "orchestration.failed": {
    kind: "orchestration.failed",
    source: "orchestration",
    label: "Orchestration failed",
    icon: "x-circle",
  },
  "orchestration.recovered": {
    kind: "orchestration.recovered",
    source: "orchestration",
    label: "Orchestration recovered",
    icon: "life-buoy",
  },
  "orchestration.previewed": {
    kind: "orchestration.previewed",
    source: "orchestration",
    label: "Orchestration previewed",
    icon: "eye",
  },
};

export function describeKind(kind: TimelineKind): TimelineKindDescriptor {
  return TIMELINE_REGISTRY[kind];
}
