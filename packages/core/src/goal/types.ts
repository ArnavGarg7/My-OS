import type {
  GoalLinkTarget,
  GoalPriority,
  GoalStatus,
  GoalType,
  HabitFrequency,
  KeyResultStatus,
  MetricType,
  ObjectiveStatus,
  ReviewPeriod,
} from "./constants";

/**
 * Goal domain types (Sprint 2.12). Raw entities (goals, objectives, key results,
 * habits, reviews, links) + derived analytics (progress, forecast, summaries).
 * Progress/forecast are always computed, never stored.
 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  goalType: GoalType;
  status: GoalStatus;
  priority: GoalPriority;
  targetDate: string | null; // ISO date
  startedAt: string | null; // ISO
  completedAt: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
  objectives: Objective[];
  habits: Habit[];
  links: GoalLink[];
}

export interface Objective {
  id: string;
  goalId: string;
  title: string;
  description: string;
  weight: number; // relative weight within the goal
  status: ObjectiveStatus;
  keyResults: KeyResult[];
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  metricType: MetricType;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: KeyResultStatus;
}

export interface Habit {
  id: string;
  goalId: string | null;
  title: string;
  frequency: HabitFrequency;
  target: number; // completions per period
  currentStreak: number;
  longestStreak: number;
  lastCompleted: string | null; // ISO date
  active: boolean;
  /** Completion dates (YYYY-MM-DD) within the tracked window. */
  history: string[];
}

export interface GoalReview {
  id: string;
  goalId: string;
  reviewPeriod: ReviewPeriod;
  summary: string;
  progressSnapshot: number; // 0–100 at review time
  reviewedAt: string; // ISO
}

export interface GoalLink {
  target: GoalLinkTarget;
  targetId: string;
}

// --- derived analytics ---
export interface KeyResultProgress {
  keyResult: KeyResult;
  progressPercent: number;
  complete: boolean;
}

export interface ObjectiveProgress {
  objective: Objective;
  progressPercent: number;
  keyResults: KeyResultProgress[];
  complete: boolean;
}

export interface HabitStats {
  habit: Habit;
  completionPercent: number;
  consistency: number; // 0–100 over the window
  missedDays: number;
  atRisk: boolean;
}

export interface GoalProgress {
  goalId: string;
  overall: number; // 0–100
  objectivesPercent: number;
  habitsPercent: number;
  completedObjectives: number;
  totalObjectives: number;
}

export interface GoalForecast {
  velocityPerDay: number; // progress points per day
  estimatedCompletion: string | null; // ISO date
  status: "ahead" | "on_track" | "behind" | "unknown";
  projectedProgressAtTarget: number; // 0–100
}

export interface GoalSummaryItem {
  goal: Goal;
  progress: GoalProgress;
  forecast: GoalForecast;
}

export interface GoalPortfolio {
  activeCount: number;
  overallProgress: number; // 0–100
  behindCount: number;
  habitStreak: number; // best current streak across habits
  nextMilestone: { goalTitle: string; title: string; dueInDays: number } | null;
}

/** Deterministic signals exposed to Decision / Morning / Planner. */
export interface GoalSignals {
  activeCount: number;
  overallProgress: number;
  behindGoals: { title: string; progress: number }[];
  habitsAtRisk: { title: string }[];
  bestHabitStreak: number;
  quarterEnding: boolean;
}
