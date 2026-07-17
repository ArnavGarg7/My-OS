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
  "note.created": {
    kind: "note.created",
    source: "knowledge",
    label: "Note created",
    icon: "file-text",
  },
  "wiki.created": {
    kind: "wiki.created",
    source: "knowledge",
    label: "Wiki page created",
    icon: "network",
  },
  "book.finished": {
    kind: "book.finished",
    source: "knowledge",
    label: "Book finished",
    icon: "book-open",
  },
  "course.completed": {
    kind: "course.completed",
    source: "knowledge",
    label: "Course completed",
    icon: "graduation-cap",
  },
  "research.created": {
    kind: "research.created",
    source: "knowledge",
    label: "Research created",
    icon: "flask-conical",
  },
  "flashcard.reviewed": {
    kind: "flashcard.reviewed",
    source: "knowledge",
    label: "Flashcard reviewed",
    icon: "layers",
  },
  "life_habit.completed": {
    kind: "life_habit.completed",
    source: "life",
    label: "Habit completed",
    icon: "check-circle",
  },
  "routine.completed": {
    kind: "routine.completed",
    source: "life",
    label: "Routine completed",
    icon: "list-checks",
  },
  "workout.completed": {
    kind: "workout.completed",
    source: "life",
    label: "Workout logged",
    icon: "dumbbell",
  },
  "medication.logged": {
    kind: "medication.logged",
    source: "life",
    label: "Medication logged",
    icon: "pill",
  },
  "appointment.completed": {
    kind: "appointment.completed",
    source: "life",
    label: "Appointment completed",
    icon: "stethoscope",
  },
  "injury.logged": {
    kind: "injury.logged",
    source: "life",
    label: "Injury logged",
    icon: "bandage",
  },
  "personal_review.completed": {
    kind: "personal_review.completed",
    source: "life",
    label: "Personal review completed",
    icon: "clipboard-check",
  },
  "investment.updated": {
    kind: "investment.updated",
    source: "resource",
    label: "Investment updated",
    icon: "trending-up",
  },
  "asset.added": {
    kind: "asset.added",
    source: "resource",
    label: "Asset added",
    icon: "package",
  },
  "maintenance.completed": {
    kind: "maintenance.completed",
    source: "resource",
    label: "Maintenance completed",
    icon: "wrench",
  },
  "document.renewed": {
    kind: "document.renewed",
    source: "resource",
    label: "Document renewed",
    icon: "file-check",
  },
  "relationship.created": {
    kind: "relationship.created",
    source: "resource",
    label: "Relationship added",
    icon: "user-plus",
  },
  "interaction.logged": {
    kind: "interaction.logged",
    source: "resource",
    label: "Interaction logged",
    icon: "message-circle",
  },
  birthday: {
    kind: "birthday",
    source: "resource",
    label: "Birthday",
    icon: "cake",
  },
  "insurance.renewed": {
    kind: "insurance.renewed",
    source: "resource",
    label: "Insurance renewed",
    icon: "shield-check",
  },
  "review.generated": {
    kind: "review.generated",
    source: "dashboard",
    label: "Review generated",
    icon: "clipboard-check",
  },
  "report.generated": {
    kind: "report.generated",
    source: "dashboard",
    label: "Report generated",
    icon: "file-text",
  },
  "milestone.reached": {
    kind: "milestone.reached",
    source: "dashboard",
    label: "Milestone reached",
    icon: "flag",
  },
  "achievement.unlocked": {
    kind: "achievement.unlocked",
    source: "dashboard",
    label: "Achievement unlocked",
    icon: "trophy",
  },
};

export function describeKind(kind: TimelineKind): TimelineKindDescriptor {
  return TIMELINE_REGISTRY[kind];
}
