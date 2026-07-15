import type { ComparisonPeriod, ReportType, TrendWindowKey } from "./constants";
import type { TimelineEvent } from "../timeline";

/**
 * Analytics engine types (Sprint 2.14). Analytics never owns data — it reads the
 * immutable Timeline stream plus small domain "snapshot" inputs the server
 * assembles from existing summaries. Every derived value is deterministic.
 */

/** Lean domain snapshots (server fills these from existing summaries). */
export interface HealthAnalyticsInput {
  avgReadiness: number; // 0–100
  avgSleepMinutes: number;
  avgHydrationPercent: number; // 0–100
  recoveryScore: number; // 0–100
  workoutCount: number;
  workoutTargetPerWeek?: number;
}

export interface FinanceAnalyticsInput {
  totalIncome: number;
  totalExpense: number;
  budgetAdherence: number; // 0–100 (100 = fully within budget)
  savingsRate: number; // 0–100
  subscriptionCost: number;
}

export interface GoalAnalyticsInput {
  activeCount: number;
  overallProgress: number; // 0–100
  objectivesCompleted: number;
  habitConsistency: number; // 0–100
  completionRate: number; // 0–100
  forecastAccuracy: number; // 0–100
}

export interface ProjectAnalyticsInput {
  completed: number;
  milestonesCompleted: number;
  atRisk: number;
  velocity: number; // tasks/week
}

export interface PlannerAnalyticsInput {
  accuracy: number; // 0–100
  blocksCompleted: number;
  blocksTotal: number;
  regenerations: number;
  lockedBlocks: number;
  overflow: number;
  utilization: number; // 0–100
}

export interface JournalAnalyticsInput {
  writingStreak: number;
  wordCount: number;
  reflectionCount: number;
  moodTrend: number; // average mood value 1–5
  gratitudeCount: number;
}

/** Everything the analytics engine reads for a computation. */
export interface AnalyticsContext {
  now: Date;
  timezone: string;
  /** The unified Timeline stream — the primary source. */
  events: TimelineEvent[];
  health?: HealthAnalyticsInput;
  finance?: FinanceAnalyticsInput;
  goals?: GoalAnalyticsInput;
  projects?: ProjectAnalyticsInput;
  planner?: PlannerAnalyticsInput;
  journal?: JournalAnalyticsInput;
}

/** A single named metric with its value + unit. */
export interface Metric {
  key: string;
  label: string;
  value: number;
  unit: "count" | "percent" | "minutes" | "hours" | "currency" | "score" | "ratio";
}

export interface ProductivityMetrics {
  tasksCompleted: number;
  tasksCreated: number;
  plannerCompletion: number; // 0–100
  deepWorkMinutes: number;
  contextSwitches: number;
  focusBlocks: number;
  decisionsCompleted: number;
  avgExecutionMinutes: number;
  score: number; // 0–100
}

export interface FocusMetrics {
  deepWorkMinutes: number;
  focusBlocks: number;
  contextSwitches: number;
  longestBlockMinutes: number;
  score: number; // 0–100
}

export interface CalendarMetrics {
  meetingHours: number;
  focusHours: number;
  freeHours: number;
  meetingRatio: number; // 0–100
  utilization: number; // 0–100
  longestUninterruptedMinutes: number;
}

export interface TimelineMetrics {
  totalEvents: number;
  dailyAverage: number;
  bySource: Record<string, number>;
  peakDay: { date: string; count: number } | null;
  activeDays: number;
}

/** A directional trend over a window. */
export interface Trend {
  metric: string;
  window: TrendWindowKey;
  direction: "up" | "down" | "flat";
  changePercent: number; // signed
  current: number;
  previous: number;
}

/** A period-over-period comparison. */
export interface Comparison {
  metric: string;
  period: ComparisonPeriod;
  current: number;
  previous: number;
  delta: number; // signed absolute
  changePercent: number; // signed
  direction: "up" | "down" | "flat";
}

/** A deterministic, rule-based forecast. */
export interface Forecast {
  metric: string;
  horizonDays: number;
  projected: number;
  velocityPerDay: number;
  basis: "historical-velocity";
}

/** The composite scoreboard for a period. */
export interface ScoreBoard {
  productivity: number;
  focus: number;
  planner: number;
  health: number;
  goals: number;
  finance: number;
  journal: number;
  overall: number;
}

/** A full period review (weekly/monthly/quarterly/yearly). */
export interface Review {
  reportType: ReportType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  scores: ScoreBoard;
  productivity: ProductivityMetrics;
  focus: FocusMetrics;
  timeline: TimelineMetrics;
  highlights: {
    mostProductiveDay: { date: string; count: number } | null;
    longestFocusMinutes: number;
    largestExpense: number;
    bestHabit: string | null;
    worstHabit: string | null;
    topDecision: string | null;
  };
  achievements: string[];
  bottlenecks: string[];
  upcomingRisks: string[];
}

/** Aggregate statistics over the analytics window. */
export interface AnalyticsStatistics {
  totalEvents: number;
  activeDays: number;
  averageEventsPerDay: number;
  overallScore: number;
  bestDay: { date: string; count: number } | null;
}
