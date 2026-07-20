/**
 * Chief of Staff types (Sprint 5.2). The design IS the `ChiefContext` — every fact the Chief
 * reasons over arrives already computed by the deterministic engines' public read models (the
 * server composer is the single place that reads them). The Chief core imports no other domain and
 * computes no business logic: it selects, ranks, explains and shapes what the deterministic
 * foundation already produced (06_AI_Architecture §1: deterministic skeleton, LLM judgment).
 *
 * Pure types — no zod, no IO. Runtime validation lives in ./schemas.
 */

export type ConfidenceLevel = "low" | "medium" | "high" | "very_high";

/** What the Chief recommends doing. All actions map to existing deterministic operations. */
export type RecommendationAction =
  | "start_focus"
  | "start_block"
  | "take_break"
  | "prepare"
  | "reschedule"
  | "review"
  | "plan"
  | "idle";

/** A reference to an entity owned by a deterministic module (ids only — never copies data). */
export interface EntityRef {
  module: string;
  id: string;
}

/** A free interval the user could work in, from the Planner/Calendar free-busy read model. */
export interface FocusWindow {
  start: string;
  end: string;
  minutes: number;
  uninterrupted: boolean;
}

/** A scheduled block from the Planner read model. */
export interface PlanBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
  /** planned | active | done | missed | skipped. */
  status: string;
  locked: boolean;
  taskId?: string | null;
}

/** A calendar event (fixed time) from the Calendar read model. */
export interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

/** A scored task from the deterministic Prioritizer read model (score already computed). */
export interface ScoredTask {
  id: string;
  title: string;
  score: number;
  dueAt?: string | null;
  estimateMin?: number | null;
  area?: string | null;
  status: string;
}

export interface GoalSignal {
  id: string;
  title: string;
  progress: number;
  staleDays: number;
}

/** A disruption that may invalidate the plan (drives Rescue My Day). */
export interface Disruption {
  kind:
    | "missed_block"
    | "cancelled_event"
    | "delay"
    | "low_energy"
    | "focus_lost"
    | "free_time"
    | "manual";
  detail: string;
  /** Minutes of newly-free or lost time, where applicable. */
  minutes?: number | undefined;
  ref?: EntityRef | undefined;
}

/**
 * The Personal AI Profile (Sprint 5.2) — DISTINCT from memories. User-editable preferences the
 * Chief steers with. The AI only changes these through ACCEPTED feedback, never silently, and
 * they never alter deterministic calculations.
 */
export interface PersonalProfile {
  deepWorkPreferredStartHour: number;
  deepWorkMinBlockMinutes: number;
  studyPreferredStartHour: number;
  workoutPreferredHour: number;
  meetingPreference: "batch" | "spread";
  planningStyle: "detailed" | "flexible";
  communicationStyle: "concise" | "warm";
  notificationStyle: "proactive" | "quiet";
  breakFrequencyMinutes: number;
  reviewStyle: "daily" | "weekly";
  decisionStyle: "fast" | "deliberate";
  /** Bumped each time an accepted feedback refines the profile. */
  revision: number;
}

/** The full input the Chief reasons over. Built by the server composer from read models. */
export interface ChiefContext {
  now: string;
  timezone: string;
  greetingName: string;
  readiness: number | null;
  energy: "low" | "medium" | "high" | null;
  mission: { title: string; priorities: { rank: number; label: string; ref?: EntityRef }[] };
  focusWindows: FocusWindow[];
  planBlocks: PlanBlock[];
  calendarEvents: CalEvent[];
  tasks: ScoredTask[];
  goals: GoalSignal[];
  activeFocusSession: { startedAt: string; plannedMinutes: number } | null;
  pendingDecisions: number;
  disruptions: Disruption[];
  profile: PersonalProfile;
}

/** The structured explanation attached to every recommendation (06_AI_Architecture §9 grammar). */
export interface Explanation {
  situation: string;
  recommendation: string;
  alternatives: string[];
  costOfIgnoring: string;
  confidence: ConfidenceLevel;
}

/** An alternative the user could pick instead. */
export interface Alternative {
  title: string;
  action: RecommendationAction;
  ref?: EntityRef;
}

/** The Now Engine's answer to "what should I do right now?". */
export interface Recommendation {
  action: RecommendationAction;
  title: string;
  ref?: EntityRef;
  estimateMinutes: number | null;
  confidence: ConfidenceLevel;
  explanation: Explanation;
  alternatives: Alternative[];
}

/** One change in a planner proposal (never applied until the user accepts). */
export interface PlanChange {
  kind: "move" | "delete" | "add" | "reorder" | "break";
  blockId?: string;
  title?: string;
  from?: string;
  to?: string;
  reason: string;
}

/** A planner proposal — the ONLY output of Optimize/Rescue/Night; the live plan is never edited. */
export interface PlannerProposal {
  kind: "optimize" | "rescue" | "night";
  changes: PlanChange[];
  summary: string;
  rationale: string;
  confidence: ConfidenceLevel;
}

/** Morning Intelligence output (extends the Morning Briefing). */
export interface MorningIntelligence {
  greeting: string;
  readiness: number | null;
  mission: { rank: number; label: string; ref?: EntityRef }[];
  recommendation: Recommendation;
  biggestRisk: string | null;
  opportunity: string | null;
  focusWindow: FocusWindow | null;
  preparationChecklist: string[];
  confidence: ConfidenceLevel;
}

/** A proactive AI notification (grounded in a deterministic trigger). */
export interface ChiefNotification {
  kind: "free_time" | "break_due" | "deadline_leave" | "readiness";
  title: string;
  body: string;
  action?: Alternative;
}

/** Feedback on a recommendation (drives profile + policy + prompt steering only). */
export type FeedbackOutcome = "accepted" | "modified" | "rejected" | "ignored";
export interface Feedback {
  recommendationId: string;
  outcome: FeedbackOutcome;
  note?: string | undefined;
}
