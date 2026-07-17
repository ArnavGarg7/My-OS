import {
  SCORE_AT_RISK,
  SCORE_EXCELLENT,
  SCORE_GOOD,
  SCORE_STABLE,
  TREND_EPSILON,
  type AttentionLevel,
  type TrendDirection,
} from "./constants";

/**
 * Banding helpers (Sprint 4.4). The single place a 0–100 score becomes a word and a
 * before/after pair becomes a direction. Every scorecard, life area and attention item
 * bands through here, so "excellent" means exactly one thing across the whole dashboard.
 */

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Score → attention band. The one score-to-word mapping in the platform. */
export function levelForScore(score: number): AttentionLevel {
  if (score >= SCORE_EXCELLENT) return "excellent";
  if (score >= SCORE_GOOD) return "improving";
  if (score >= SCORE_STABLE) return "stable";
  if (score >= SCORE_AT_RISK) return "at_risk";
  return "needs_attention";
}

/**
 * A trend that also respects recency: a high but falling score is still "at_risk", because
 * the direction is what deserves attention. Rising past the stable line reads as improving.
 */
export function levelForTrend(score: number, direction: TrendDirection): AttentionLevel {
  const base = levelForScore(score);
  if (direction === "falling" && (base === "excellent" || base === "improving")) return "at_risk";
  if (direction === "rising" && base === "stable") return "improving";
  return base;
}

/** current vs previous → direction, with a dead-band so noise reads as flat. */
export function directionOf(current: number, previous: number | null): TrendDirection {
  if (previous === null) return "flat";
  const delta = current - previous;
  if (delta >= TREND_EPSILON) return "rising";
  if (delta <= -TREND_EPSILON) return "falling";
  return "flat";
}

/** Rank used to sort attention worst-first. */
export function levelRank(level: AttentionLevel): number {
  switch (level) {
    case "needs_attention":
      return 0;
    case "at_risk":
      return 1;
    case "stable":
      return 2;
    case "improving":
      return 3;
    case "excellent":
      return 4;
  }
}
