/**
 * Tomorrow Studio constants (Sprint 3.1). Tomorrow Studio is the deterministic
 * evening counterpart to Morning Briefing: a guided workflow that reviews today,
 * carries unfinished work forward, sets tomorrow's priorities, previews a plan
 * and prepares readiness. No AI — every threshold lives here so the flow is
 * reproducible and explainable. Tomorrow orchestrates existing engines; it owns
 * nothing.
 */

/** The eight guided steps, in order. */
export const STUDIO_STEPS = [
  "review",
  "carry_forward",
  "priorities",
  "calendar",
  "planner",
  "readiness",
  "checklist",
  "finalize",
] as const;
export type StudioStep = (typeof STUDIO_STEPS)[number];

export const STEP_LABEL: Record<StudioStep, string> = {
  review: "Today's Review",
  carry_forward: "Carry Forward",
  priorities: "Choose Priorities",
  calendar: "Tomorrow Calendar",
  planner: "Planner Preview",
  readiness: "Readiness",
  checklist: "Checklist",
  finalize: "Finalize Tomorrow",
};

/** Plan lifecycle (DB enum `tomorrow_status`). */
export const TOMORROW_STATUSES = ["draft", "planned", "locked", "completed"] as const;
export type TomorrowStatus = (typeof TOMORROW_STATUSES)[number];

/** Carry-forward source kinds. */
export const CARRY_FORWARD_KINDS = [
  "task",
  "planner_block",
  "milestone",
  "decision",
  "inbox",
] as const;
export type CarryForwardKind = (typeof CARRY_FORWARD_KINDS)[number];

/** Priority candidate source kinds. */
export const PRIORITY_KINDS = ["task", "project", "goal", "decision"] as const;
export type PriorityKind = (typeof PRIORITY_KINDS)[number];

/** How many priorities the studio surfaces. */
export const TOP_PRIORITIES = 3;
export const MAX_PRIORITIES = 5;

/** Priority score weights (relative; higher wins). */
export const PRIORITY_WEIGHTS = {
  taskPriority: 3,
  projectUrgency: 2.5,
  goalDeadline: 2,
  plannerOverflow: 1.5,
  decisionImportance: 1.5,
  calendarLoad: 1,
} as const;

/** Above this many carry-forward items, tomorrow is overloaded. */
export const OVERLOADED_CARRY_FORWARD = 8;
/** Meeting minutes at/above which tomorrow is "meeting-heavy". */
export const HEAVY_MEETING_MINUTES = 180;
/** Readiness at/below which tomorrow's intensity should drop. */
export const LOW_READINESS = 60;
/** A healthy default sleep target (minutes). */
export const DEFAULT_SLEEP_TARGET_MINUTES = 450;
/** Assumed length of a working day (minutes) for workload/focus math. */
export const WORKING_DAY_MINUTES = 8 * 60;

/** Static, user-configurable evening checklist template. */
export const DEFAULT_CHECKLIST: { item: string; required: boolean }[] = [
  { item: "Review inbox", required: true },
  { item: "Set tomorrow's priorities", required: true },
  { item: "Review tomorrow's calendar", required: true },
  { item: "Prepare tomorrow", required: false },
  { item: "Pack laptop", required: false },
  { item: "Charge devices", required: false },
  { item: "Hydration", required: false },
  { item: "Set sleep target", required: true },
];

/** Workload intensity bands (minutes of committed work). */
export function intensityBand(workloadMinutes: number): "light" | "moderate" | "heavy" {
  if (workloadMinutes < 180) return "light";
  if (workloadMinutes < 360) return "moderate";
  return "heavy";
}
