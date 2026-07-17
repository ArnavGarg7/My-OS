import {
  ATTENTION_OVERLOAD_LIMIT,
  BALANCE_SPREAD_LIMIT,
  DECLINING_AREAS_LIMIT,
  OVERALL_LOW_LIMIT,
  OVERALL_POSITIVE_LIMIT,
} from "./constants";
import { levelForScore } from "./bands";
import { attentionItems, needsAttention } from "./attention";
import { executiveSummary } from "./executive-summary";
import { decliningAreas, lifeBalance } from "./life-areas";
import { reviewsDueCount } from "./reviews";
import type { IntelligenceInput, IntelligenceSignals, IntelligenceSummary } from "./types";

/**
 * Intelligence selectors (Sprint 4.4). The two read models the rest of My OS consumes:
 * `computeSignals` (booleans for the Decision engine; every threshold lives in constants,
 * never in a rule) and `buildSummary` (the compact object Morning, Tomorrow and the status
 * bar read). Both are pure fan-outs over the composed views.
 */

export function computeSignals(input: IntelligenceInput): IntelligenceSignals {
  const balance = lifeBalance(input);
  const declining = decliningAreas(balance.areas).length;
  const attention = needsAttention(attentionItems(input)).length;
  return {
    multipleAreasDeclining: declining >= DECLINING_AREAS_LIMIT,
    overallHealthLow: balance.overall < OVERALL_LOW_LIMIT,
    overallGrowthPositive: balance.overall >= OVERALL_POSITIVE_LIMIT,
    reviewDue: reviewsDueCount(input) > 0,
    lifeBalanceLow: balance.imbalanced,
    attentionOverload: attention > ATTENTION_OVERLOAD_LIMIT,
  };
}

export function emptySignals(): IntelligenceSignals {
  return {
    multipleAreasDeclining: false,
    overallHealthLow: false,
    overallGrowthPositive: false,
    reviewDue: false,
    lifeBalanceLow: false,
    attentionOverload: false,
  };
}

export function buildSummary(input: IntelligenceInput): IntelligenceSummary {
  const balance = lifeBalance(input);
  const summary = executiveSummary(input);
  return {
    overall: balance.overall,
    overallLevel: levelForScore(balance.overall),
    focusLabel: summary.focusLabel,
    needsAttention: needsAttention(attentionItems(input)).length,
    strongest: balance.strongest,
    weakest: balance.weakest,
    reviewsDue: reviewsDueCount(input),
  };
}

export function emptySummary(): IntelligenceSummary {
  return {
    overall: 0,
    overallLevel: "needs_attention",
    focusLabel: "low",
    needsAttention: 0,
    strongest: "health",
    weakest: "health",
    reviewsDue: 0,
  };
}

/** Surfaced so the UI can restate the exact thresholds a signal fired on. */
export const SIGNAL_THRESHOLDS = {
  decliningAreas: DECLINING_AREAS_LIMIT,
  overallLow: OVERALL_LOW_LIMIT,
  overallPositive: OVERALL_POSITIVE_LIMIT,
  balanceSpread: BALANCE_SPREAD_LIMIT,
  attentionOverload: ATTENTION_OVERLOAD_LIMIT,
} as const;
