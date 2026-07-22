/**
 * Confidence Engine (Sprint 6.2). Deterministically scores how much to trust a prediction from:
 * history size, stability (variability), missing data, and forecast horizon (spec §Confidence
 * Engine). Pure — no AI. Longer horizons + sparse/noisy history → lower confidence.
 */
import type { Confidence, ConfidenceLevel } from "./types";

export interface ConfidenceInput {
  /** Number of historical data points available. */
  samples: number;
  /** Coefficient of variation of the history (0 = perfectly stable). */
  variability: number;
  /** Fraction of expected data that was missing (0..1). */
  missingFraction: number;
  /** Forecast horizon in days. */
  horizonDays: number;
  /** Whether other signals conflict with this forecast. */
  conflicting?: boolean;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Compute a deterministic confidence band + score + reasons. */
export function computeConfidence(input: ConfidenceInput): Confidence {
  const reasons: string[] = [];

  // History: saturates around 14 points.
  const historyScore = clamp01(input.samples / 14);
  reasons.push(`${input.samples} historical data point${input.samples === 1 ? "" : "s"}`);

  // Stability: variability 0 → 1, 1+ → 0.
  const stabilityScore = clamp01(1 - input.variability);
  if (input.variability > 0.5) reasons.push("history is volatile");
  else if (input.samples >= 3) reasons.push("history is stable");

  // Completeness.
  const completenessScore = clamp01(1 - input.missingFraction);
  if (input.missingFraction > 0.25)
    reasons.push(`${Math.round(input.missingFraction * 100)}% of data missing`);

  // Horizon: <=3d full, decays to ~0 at 30d.
  const horizonScore = clamp01(1 - Math.max(0, input.horizonDays - 3) / 27);
  if (input.horizonDays > 14) reasons.push(`long ${input.horizonDays}-day horizon`);

  let score =
    historyScore * 0.35 + stabilityScore * 0.25 + completenessScore * 0.15 + horizonScore * 0.25;
  if (input.conflicting) {
    score *= 0.75;
    reasons.push("conflicting signals present");
  }
  score = Math.round(clamp01(score) * 100) / 100;

  return { level: level(score), score, reasons };
}

function level(score: number): ConfidenceLevel {
  if (score >= 0.8) return "very_high";
  if (score >= 0.6) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

/** Numeric weight of a confidence band (for merging / notification decisions). */
export function confidenceWeight(level: ConfidenceLevel): number {
  return { very_high: 1, high: 0.8, medium: 0.55, low: 0.3 }[level];
}
