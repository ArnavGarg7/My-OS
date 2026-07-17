/**
 * Personal Intelligence Dashboard constants (Sprint 4.4). The executive layer of My OS —
 * the final deterministic sprint before Phase 5 (AI). This module introduces almost no new
 * business logic: it COMPOSES the read models every other engine already produces into one
 * view that answers "how is my whole life going?".
 *
 * Guiding rule, enforced by the type system below: the intelligence core takes numbers that
 * other modules already computed and never recomputes them. No AI, no embeddings, no ML, no
 * heuristics beyond the explicit deterministic rules here.
 */

/** The eight high-level life areas the dashboard rolls everything up into. */
export const LIFE_AREAS = [
  "health",
  "career",
  "learning",
  "finance",
  "relationships",
  "growth",
  "productivity",
  "wellbeing",
] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];

export const LIFE_AREA_LABELS: Record<LifeArea, string> = {
  health: "Health",
  career: "Career",
  learning: "Learning",
  finance: "Finance",
  relationships: "Relationships",
  growth: "Personal Growth",
  productivity: "Productivity",
  wellbeing: "Wellbeing",
};

/** Attention bands, best → worst is the reverse: the panel sorts worst first. */
export const ATTENTION_LEVELS = [
  "needs_attention",
  "at_risk",
  "stable",
  "improving",
  "excellent",
] as const;
export type AttentionLevel = (typeof ATTENTION_LEVELS)[number];

/** Direction of a trend over the comparison window. */
export const TREND_DIRECTIONS = ["rising", "flat", "falling"] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

export const REVIEW_PERIODS = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type ReviewPeriod = (typeof REVIEW_PERIODS)[number];

export const REPORT_FORMATS = ["markdown", "json"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

/** The widgets the executive dashboard can show. Layout order is user config only. */
export const DASHBOARD_WIDGETS = [
  "today",
  "productivity",
  "health",
  "learning",
  "resources",
  "finance",
  "relationships",
  "goals",
  "habits",
  "calendar",
  "timeline",
  "notifications",
  "readiness",
  "decision",
] as const;
export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];

export const MILESTONE_STATUSES = ["completed", "upcoming", "overdue"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

/* ── Score bands (0–100) — the ONE place scores turn into words ─────────── */

/** A life-area or scorecard score at or above this is excellent. */
export const SCORE_EXCELLENT = 80;
/** …improving/good. */
export const SCORE_GOOD = 65;
/** …stable. */
export const SCORE_STABLE = 50;
/** …at risk. Below this is "needs attention". */
export const SCORE_AT_RISK = 35;

/** A trend must move at least this many points to count as rising/falling, not flat. */
export const TREND_EPSILON = 3;
/** Life balance is "low" when the spread between the best and worst area exceeds this. */
export const BALANCE_SPREAD_LIMIT = 40;
/** This many life areas falling at once trips the multiple-areas-declining rule. */
export const DECLINING_AREAS_LIMIT = 3;
/** More than this many attention items at "needs_attention" is overload. */
export const ATTENTION_OVERLOAD_LIMIT = 5;
/** Overall life score below this trips the overall-health-low rule. */
export const OVERALL_LOW_LIMIT = 45;
/** Overall life score at/above this counts as positive momentum. */
export const OVERALL_POSITIVE_LIMIT = 75;

/** How the eight life areas roll up into the single overall life score — weights sum to 100. */
export const LIFE_AREA_WEIGHTS: Record<LifeArea, number> = {
  health: 16,
  productivity: 16,
  growth: 14,
  learning: 12,
  finance: 12,
  relationships: 12,
  career: 10,
  wellbeing: 8,
};
