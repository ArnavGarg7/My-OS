import { DECISION_RULES } from "./rules";
import { scoreDecision } from "./score";
import type { Decision, DecisionContext, DecisionExplanation } from "./types";

/**
 * Decision explainer (Sprint 2.3). Produces a purely deterministic explanation:
 * the rule that fired, the reason, the confidence, the inputs used, and the
 * exact score breakdown. No AI, no natural-language generation.
 */
export function explainDecision(decision: Decision, ctx: DecisionContext): DecisionExplanation {
  const rule = DECISION_RULES.find((r) => r.id === decision.ruleId);
  const { score, breakdown } = scoreDecision(decision, ctx);
  return {
    ruleId: decision.ruleId,
    rule: rule?.ruleName ?? decision.ruleId,
    reason: decision.reason,
    confidence: decision.confidence,
    inputs: decision.inputsUsed,
    score,
    breakdown,
  };
}
