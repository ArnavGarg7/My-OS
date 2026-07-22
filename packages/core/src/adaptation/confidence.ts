/**
 * Confidence Engine (Sprint 6.5, spec §Confidence Engine). Deterministically scores how much to trust
 * a learned value from: observation count, consistency, time span, contradictions, and recency. Pure —
 * no AI. More consistent observations over a longer span → higher confidence; contradictions and
 * staleness lower it. Below a floor the level is `unknown` (the OS never guesses).
 */
import type { Confidence, ConfidenceLevel } from "./types";

export interface ConfidenceInput {
  /** Number of supporting observations. */
  observations: number;
  /** 0..1 how consistent the observations are (1 = all agree). */
  consistency: number;
  /** Span of the evidence, in days. */
  timeSpanDays: number;
  /** Number of observations that contradicted the learned value. */
  contradictions: number;
  /** Days since the most recent supporting observation. */
  recencyDays: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Compute a deterministic confidence band + score + reasons. */
export function computeConfidence(input: ConfidenceInput): Confidence {
  const reasons: string[] = [];

  if (input.observations < 3) {
    return {
      level: "unknown",
      score: 0,
      reasons: [
        `only ${input.observations} observation${input.observations === 1 ? "" : "s"} so far`,
      ],
    };
  }

  // Volume: saturates around 20 observations.
  const volumeScore = clamp01(input.observations / 20);
  reasons.push(`${input.observations} observations`);

  // Consistency dominates — a stable pattern is trustworthy.
  const consistencyScore = clamp01(input.consistency);
  if (input.consistency >= 0.8) reasons.push("highly consistent");
  else if (input.consistency < 0.5) reasons.push("mixed behavior");

  // Time span: saturates around 6 weeks.
  const spanScore = clamp01(input.timeSpanDays / 42);
  reasons.push(`over ${Math.round(input.timeSpanDays)} days`);

  // Recency: full for <=7 days, decays to ~0 at 60 days stale.
  const recencyScore = clamp01(1 - Math.max(0, input.recencyDays - 7) / 53);
  if (input.recencyDays > 21) reasons.push(`last seen ${Math.round(input.recencyDays)} days ago`);

  let score = volumeScore * 0.25 + consistencyScore * 0.4 + spanScore * 0.2 + recencyScore * 0.15;

  if (input.contradictions > 0) {
    const penalty = clamp01(input.contradictions / (input.observations + input.contradictions));
    score *= 1 - penalty * 0.6;
    reasons.push(
      `${input.contradictions} contradicting observation${input.contradictions === 1 ? "" : "s"}`,
    );
  }

  score = Math.round(clamp01(score) * 100) / 100;
  return { level: bandFor(score), score, reasons };
}

/** Map a 0..1 score to a confidence band. */
export function bandFor(score: number): ConfidenceLevel {
  if (score >= 0.8) return "very_high";
  if (score >= 0.6) return "high";
  if (score >= 0.4) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

/** Whether a confidence is strong enough to act on (surface without a caveat). */
export function isActionable(c: Confidence): boolean {
  return c.level === "high" || c.level === "very_high";
}
