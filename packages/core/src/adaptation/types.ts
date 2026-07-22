/**
 * Adaptive Personal Intelligence Engine — types (Sprint 6.5, Phase 6 finale). The deterministic layer
 * that lets My OS understand the USER: it learns stable preferences, habits, routines, decision styles
 * and behavioral patterns from observed behavior + explicit feedback, and exposes a versioned Personal
 * Profile the Chief consumes as a READ MODEL. Pure: no IO, no clock (time injected), no AI, no
 * randomness. **The system adapts; it never guesses.** Nothing here mutates user data or bypasses
 * approval — personalization influences presentation/ordering/timing, never business logic.
 */

/** The life areas a profile spans (spec §Personal Profile Engine). */
export type ProfileCategory =
  | "productivity"
  | "learning"
  | "health"
  | "meetings"
  | "focus"
  | "planning"
  | "communication"
  | "automation"
  | "notifications"
  | "decision_style";

/** Confidence bands (spec §Confidence Engine). `unknown` = not enough evidence yet. */
export type ConfidenceLevel = "very_high" | "high" | "medium" | "low" | "unknown";

/** A deterministic confidence assessment: a band, a 0..1 score, and human reasons. */
export interface Confidence {
  level: ConfidenceLevel;
  score: number;
  reasons: string[];
}

/** The evidence backing any learned value — every field is explainable + inspectable. */
export interface Evidence {
  /** Number of supporting observations. */
  observations: number;
  /** Span of the supporting observations, in days. */
  timeSpanDays: number;
  /** How the value was learned. */
  source: "explicit" | "implicit";
  /** A short, non-sensitive description of what was observed. */
  detail: string;
}

/** A single versioned profile field: value + confidence + evidence + provenance. */
export interface ProfileField<T = string | number> {
  key: string;
  category: ProfileCategory;
  value: T;
  confidence: Confidence;
  evidence: Evidence;
  lastUpdated: string;
  version: number;
}

/** The complete deterministic Personal Profile (a bag of versioned fields, grouped by category). */
export interface PersonalProfile {
  fields: ProfileField[];
  /** Overall profile maturity 0..1 (how much the OS knows about the user). */
  maturity: number;
  generatedAt: string;
}

/**
 * A generic behavioral observation — the raw input the engine aggregates. Modules translate their
 * frozen read models / history into these; the engine never reads a module directly.
 */
export interface Observation {
  category: ProfileCategory;
  /** What is being observed, e.g. "focus_block_length", "study_location", "workout_time". */
  key: string;
  /** The observed value (a choice, a duration, a location…). */
  value: string | number;
  /** ISO timestamp of the observation. */
  at: string;
  /** Optional weight (explicit user input weighs more than implicit inference). */
  weight?: number;
}

/** A learned preference (spec §Preference Learning). Every preference links to evidence + is editable. */
export interface Preference {
  key: string;
  category: ProfileCategory;
  value: string | number;
  confidence: Confidence;
  evidence: Evidence;
  /** Whether the user has disabled this learned preference. */
  enabled: boolean;
  /** Explicit (user-stated) or implicit (inferred). */
  source: "explicit" | "implicit";
}

/** A daily/dated occurrence of a habit (did it happen that day?). */
export interface HabitObservation {
  date: string; // ISO date (day granularity)
  completed: boolean;
}

/** A habit model (spec §Habit Intelligence). Models never modify habits — read-only intelligence. */
export interface HabitModel {
  key: string;
  /** 0..1 current habit strength (recency-weighted completion). */
  strength: number;
  /** 0..1 consistency (regularity of the gaps). */
  consistency: number;
  /** Direction of change over the window. */
  trend: "rising" | "steady" | "declining";
  /** 0..1 probability the habit breaks given the current gap. */
  breakProbability: number;
  /** 0..1 how reliably the user resumes after a miss. */
  recoveryRate: number;
  confidence: Confidence;
  evidence: Evidence;
}

/** A discovered recurring routine (spec §Routine Discovery). Requires repeated evidence. */
export interface RoutineModel {
  key: string;
  /** 0=Sun … 6=Sat, or null for a daily routine. */
  dayOfWeek: number | null;
  /** Approximate local hour (0..23) the routine happens, or null. */
  hour: number | null;
  label: string;
  /** How many times it recurred. */
  occurrences: number;
  confidence: Confidence;
  evidence: Evidence;
}

/** Feedback on a recommendation/proposal (spec §Feedback Engine). */
export type FeedbackType =
  | "helpful"
  | "not_helpful"
  | "wrong_timing"
  | "incorrect_assumption"
  | "ignore_similar"
  | "excellent";

export interface FeedbackRecord {
  proposalId: string;
  /** The category/kind of thing the proposal was about (for weighting). */
  subject: string;
  type: FeedbackType;
  at: string;
}

/** Aggregated deterministic personalization weights derived from feedback. */
export interface FeedbackWeights {
  /** subject → weight in [-1, 1]; positive = surface more, negative = suppress. */
  bySubject: Record<string, number>;
  /** subjects the user asked to stop seeing ("ignore_similar"). */
  muted: string[];
  totalFeedback: number;
}

/** Learning modes (spec §Adaptation Policies). */
export type LearningMode = "manual" | "suggested" | "automatic";

export interface AdaptationPolicy {
  category: ProfileCategory;
  mode: LearningMode;
}

/** A behavioral metric (spec §Behavioral Analytics). */
export interface BehavioralMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "flat" | "down";
}

/** An explainable insight (spec §Insight Engine). */
export interface Insight {
  id: string;
  headline: string;
  detail: string;
  confidence: Confidence;
  evidence: Evidence;
  category: ProfileCategory;
}

/** A deterministic weekly review (spec §Weekly Intelligence Review). No generative storytelling. */
export interface WeeklyReview {
  periodStart: string;
  periodEnd: string;
  achievements: string[];
  emergingHabits: string[];
  risks: string[];
  opportunities: string[];
  recommendationQuality: number; // 0..1
  feedbackSummary: { type: FeedbackType; count: number }[];
}

/** A deterministic monthly review (spec §Monthly Intelligence Review). */
export interface MonthlyReview {
  periodStart: string;
  periodEnd: string;
  longTermTrends: string[];
  productivityEvolution: string;
  habitEvolution: string;
  focusEvolution: string;
  systemAdaptation: string;
  metrics: BehavioralMetric[];
}

/** How the Chief should personalize its output (spec §Recommendation Personalization). */
export interface PersonalizationPrefs {
  /** subject → ordering boost in [-1, 1]. */
  ordering: Record<string, number>;
  /** Preferred hour-of-day windows the user is most receptive to. */
  preferredHours: number[];
  /** Notification style the user responds to best. */
  notificationStyle: "quiet" | "standard" | "assertive";
  /** subjects to suppress entirely. */
  muted: string[];
}

/** The full deterministic input to one adaptation cycle. */
export interface AdaptationInput {
  observations: Observation[];
  habitSeries: { key: string; series: HabitObservation[] }[];
  feedback: FeedbackRecord[];
  policies?: AdaptationPolicy[];
  now: Date;
}

/** Injected deterministic id factory. */
export interface AdaptationDeps {
  newId: () => string;
}
