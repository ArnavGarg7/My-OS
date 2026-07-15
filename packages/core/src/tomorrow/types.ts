import type { CarryForwardKind, PriorityKind, StudioStep, TomorrowStatus } from "./constants";

/**
 * Tomorrow Studio types (Sprint 3.1). The engine reads lean input DTOs the server
 * assembles from existing engines (Today/Task/Planner/Calendar/Decision/Goal/
 * Health/Analytics) and produces deterministic review/carry-forward/priority/
 * readiness/checklist outputs. Tomorrow references entities; it never owns them.
 */

/** Today's execution, summarised for the review step. */
export interface DayReviewInput {
  tasksCompleted: number;
  tasksCreated: number;
  plannerAccuracy: number; // 0–100
  decisionsAccepted: number;
  deepWorkMinutes: number;
  calendarCompletion: number; // 0–100 (meetings attended / scheduled)
  goalProgress: number; // 0–100
  healthReadiness: number; // 0–100
  journalCompleted: boolean;
}

/** The deterministic day review. */
export interface DayReview {
  planningDate: string; // YYYY-MM-DD
  tasksCompleted: number;
  tasksCreated: number;
  completionScore: number; // 0–100
  plannerAccuracy: number;
  decisionsAccepted: number;
  deepWorkMinutes: number;
  calendarCompletion: number;
  goalProgress: number;
  healthReadiness: number;
  journalCompleted: boolean;
  headline: string;
}

/** A candidate to move into tomorrow (nothing moves without confirmation). */
export interface CarryForwardCandidate {
  id: string;
  kind: CarryForwardKind;
  title: string;
  reason: string;
  entityId: string;
  dueDate?: string | null;
  priority?: "low" | "medium" | "high";
}

export interface CarryForwardList {
  items: CarryForwardCandidate[];
  byKind: Record<CarryForwardKind, number>;
  total: number;
  overloaded: boolean;
}

/** A candidate for tomorrow's priorities, with its deterministic score inputs. */
export interface PriorityCandidate {
  id: string;
  kind: PriorityKind;
  title: string;
  entityId: string;
  taskPriority?: number; // 0–3
  projectUrgency?: number; // 0–3
  goalDeadline?: number; // 0–3 (closer deadline = higher)
  plannerOverflow?: number; // 0–3
  decisionImportance?: number; // 0–3
  calendarLoad?: number; // 0–3
}

export interface RankedPriority extends PriorityCandidate {
  score: number;
  rank: number;
}

export interface PrioritySelection {
  ranked: RankedPriority[];
  top: RankedPriority[]; // TOP_PRIORITIES
  optional: RankedPriority[]; // beyond top, up to MAX_PRIORITIES
}

/** A tomorrow calendar event (read-only mirror of the Calendar engine). */
export interface CalendarMergeEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  kind: "meeting" | "class" | "recurring" | "event";
}

export interface CalendarMerge {
  events: CalendarMergeEvent[];
  meetingMinutes: number;
  meetingCount: number;
  firstEventAt: string | null;
  lastEventEndsAt: string | null;
  freeWindows: { start: string; end: string; minutes: number }[];
  meetingHeavy: boolean;
}

/** A previewed planner block (from the existing Planner engine; preview only). */
export interface PlannerPreviewBlock {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  kind: string;
  minutes: number;
  locked: boolean;
}

export interface PlannerPreview {
  targetDate: string;
  blocks: PlannerPreviewBlock[];
  totalMinutes: number;
  blockCount: number;
  utilization: number; // 0–100
  status: "draft" | "accepted" | "discarded";
}

/** Deterministic readiness for tomorrow. */
export interface TomorrowReadiness {
  sleepTargetMinutes: number;
  expectedWorkloadMinutes: number;
  meetingMinutes: number;
  meetingDensity: number; // 0–100 (meeting minutes / working day)
  healthReadiness: number; // 0–100
  focusOpportunityMinutes: number;
  intensity: "light" | "moderate" | "heavy";
  recoveryRecommendation: string;
  score: number; // 0–100 composite readiness
}

/** Readiness inputs assembled by the server. */
export interface ReadinessInput {
  sleepTargetMinutes?: number;
  expectedWorkloadMinutes: number;
  meetingMinutes: number;
  healthReadiness: number; // 0–100
}

export interface ChecklistItem {
  id: string;
  item: string;
  completed: boolean;
  required: boolean;
}

export interface ChecklistProgress {
  items: ChecklistItem[];
  completed: number;
  total: number;
  requiredRemaining: number;
  percent: number; // 0–100
  allRequiredDone: boolean;
}

/** Deterministic decision signals surfaced to the Decision engine. */
export interface TomorrowSignals {
  tooMuchUnfinished: boolean;
  heavyMeetingDay: boolean;
  lowReadiness: boolean;
  carryForwardCount: number;
  priorityCount: number;
}

/** A single deterministic recommendation for the finalize step. */
export interface TomorrowRecommendation {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "warning" | "success";
}

/** Everything the engine reads for a full studio run. */
export interface TomorrowContext {
  now: Date;
  timezone: string;
  planningDate: string; // today YYYY-MM-DD
  targetDate: string; // tomorrow YYYY-MM-DD
  review: DayReviewInput;
  carryForwardCandidates: CarryForwardCandidate[];
  priorityCandidates: PriorityCandidate[];
  calendar: CalendarMergeEvent[];
  readiness: ReadinessInput;
  checklist?: { id: string; item: string; completed: boolean; required: boolean }[];
}

/** The persisted plan header (mirrors `tomorrow_plans`). */
export interface TomorrowPlan {
  id: string;
  planningDate: string;
  targetDate: string;
  status: TomorrowStatus;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The compact summary consumed by the context panel + status bar + Morning. */
export interface TomorrowSummary {
  targetDate: string;
  status: TomorrowStatus;
  priorityCount: number;
  carryForwardCount: number;
  meetingMinutes: number;
  plannerBlockCount: number;
  readinessScore: number;
  checklistPercent: number;
  currentStep: StudioStep;
  ready: boolean;
}
