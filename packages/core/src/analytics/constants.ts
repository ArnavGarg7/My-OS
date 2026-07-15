/**
 * Analytics engine constants (Sprint 2.14). The Analytics Engine is the final
 * deterministic layer: it consumes the Timeline + domain snapshots and derives
 * scores, trends, comparisons, forecasts and reviews. It never owns data. Every
 * weight/threshold lives here so results are reproducible and explainable. No AI.
 */

export const REPORT_TYPES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const COMPARISON_PERIODS = [
  "previous_day",
  "previous_week",
  "previous_month",
  "previous_quarter",
  "previous_year",
] as const;
export type ComparisonPeriod = (typeof COMPARISON_PERIODS)[number];

/** Trend windows (in days). */
export const TREND_WINDOWS = { week: 7, month: 30, quarter: 90, year: 365 } as const;
export type TrendWindowKey = keyof typeof TREND_WINDOWS;

/** Days spanned by a report period (for aggregation windows + forecasting). */
export const REPORT_SPAN_DAYS: Record<ReportType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

/**
 * Productivity score weights (sum = 1). Deep work + task completion dominate;
 * context switches apply a penalty computed separately.
 */
export const PRODUCTIVITY_WEIGHTS = {
  taskCompletion: 0.3,
  plannerAdherence: 0.25,
  deepWork: 0.25,
  decisionCompletion: 0.2,
} as const;

/** Minutes of deep work that map to a full deep-work sub-score. */
export const DEEP_WORK_TARGET_MINUTES = 240;
/** Context switches beyond this start eroding the focus score. */
export const CONTEXT_SWITCH_TOLERANCE = 5;
/** Each switch over tolerance costs this many focus points. */
export const CONTEXT_SWITCH_PENALTY = 4;

/** Focus score weights (sum = 1). */
export const FOCUS_WEIGHTS = { deepWork: 0.5, blocks: 0.3, continuity: 0.2 } as const;
/** Focus blocks that map to a full block sub-score. */
export const FOCUS_BLOCK_TARGET = 4;

/** Overall composite score weights (sum = 1). */
export const OVERALL_WEIGHTS = {
  productivity: 0.25,
  focus: 0.15,
  planner: 0.15,
  health: 0.15,
  goals: 0.15,
  finance: 0.1,
  journal: 0.05,
} as const;

/** A metric change smaller than this (in %) reads as "flat". */
export const TREND_FLAT_THRESHOLD = 2;

/** Health sub-score targets. */
export const HEALTH_TARGETS = {
  readiness: 85, // score maps readiness/target
  sleepMinutes: 450,
  hydrationPercent: 100,
  workoutsPerWeek: 4,
} as const;

/** Journal sub-score targets. */
export const JOURNAL_TARGETS = { entriesPerWeek: 5, wordsPerEntry: 150 } as const;

/** Mood level → numeric value for trend math (matches journal engine order). */
export const MOOD_VALUE: Record<string, number> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  excellent: 5,
};

/** Score band labels for editorial display. */
export function scoreBand(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}
