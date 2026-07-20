/**
 * Confidence Engine (Sprint 5.2). Deterministically scores how sure the Chief is about a
 * recommendation — low / medium / high / very_high — from schedule completeness, data availability,
 * conflicts and deterministic validation. No provider certainty is invented here; this is a
 * grounded score the explanation surfaces (never "because the AI thinks so").
 */
import type { ChiefContext, ConfidenceLevel } from "./types";

export const CONFIDENCE_ORDER: ConfidenceLevel[] = ["low", "medium", "high", "very_high"];

export interface ConfidenceInputs {
  /** Does the plan cover the day (has blocks)? */
  hasPlan: boolean;
  /** Is there an uninterrupted focus window for the recommended work? */
  hasFocusWindow: boolean;
  /** Number of unresolved conflicts/disruptions. */
  conflicts: number;
  /** Do we have readiness + energy data? */
  hasReadiness: boolean;
  /** Are there candidate tasks to act on? */
  hasCandidates: boolean;
}

/** Derive the confidence inputs from context (pure). */
export function confidenceInputs(ctx: ChiefContext): ConfidenceInputs {
  return {
    hasPlan: ctx.planBlocks.length > 0,
    hasFocusWindow: ctx.focusWindows.some((w) => w.uninterrupted && w.minutes >= 30),
    conflicts: ctx.disruptions.length,
    hasReadiness: ctx.readiness !== null && ctx.energy !== null,
    hasCandidates: ctx.tasks.length > 0,
  };
}

/**
 * Score confidence. Start from the data we have, penalize conflicts. Deterministic and monotonic:
 * more grounding + fewer conflicts → higher confidence.
 */
export function computeConfidence(inputs: ConfidenceInputs): ConfidenceLevel {
  let score = 0;
  if (inputs.hasCandidates) score += 1;
  if (inputs.hasPlan) score += 1;
  if (inputs.hasFocusWindow) score += 1;
  if (inputs.hasReadiness) score += 1;
  score -= Math.min(inputs.conflicts, 2);

  if (score >= 4) return "very_high";
  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

/** Convenience: confidence directly from a context. */
export function confidenceFor(ctx: ChiefContext): ConfidenceLevel {
  return computeConfidence(confidenceInputs(ctx));
}
