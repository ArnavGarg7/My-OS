import { RECOMMENDATION_RULES } from "./rules";
import type { BriefingContext, Recommendation } from "./types";

/**
 * Recommendation engine (Sprint 2.2). Deterministic — evaluates the rules in
 * priority order and returns the first match. Always returns a recommendation
 * (the fallback rule matches everything).
 */
const SORTED_RULES = [...RECOMMENDATION_RULES].sort((a, b) => b.priority - a.priority);

export function generateRecommendation(ctx: BriefingContext): Recommendation {
  for (const rule of SORTED_RULES) {
    if (rule.matches(ctx)) {
      return { id: rule.id, ...rule.build(ctx) };
    }
  }
  // Unreachable (the fallback rule always matches) but keeps the type total.
  return {
    id: "all-set",
    decision: "You're set for today.",
    reason: "Begin your top priority.",
    confidence: 40,
  };
}
