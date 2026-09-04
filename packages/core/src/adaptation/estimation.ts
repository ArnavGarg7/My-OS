/**
 * Estimate-vs-reality learning (Stage 5, spec §Estimation Behavior). A pure,
 * deterministic feedback loop: for tasks where BOTH a user estimate and a recorded
 * actual time exist (actuals accrue from Stage 2 task-linked focus), it measures
 * how the user's estimates relate to reality — never overwriting the user's
 * estimate, only learning a bias the planner can apply. Evidence-first: below a
 * floor it reports `unknown` rather than inventing a number. No AI, no randomness.
 */
import { computeConfidence } from "./confidence";
import type { Confidence, Evidence } from "./types";

/** One completed task's estimate and recorded actual (minutes). */
export interface EstimatePair {
  estimateMinutes: number;
  actualMinutes: number;
  /** ISO instant the task completed (for recency + span). */
  at: string;
}

export interface EstimationInsight {
  sampleSize: number;
  /** Mean(actual/estimate); >1 = under-estimating, <1 = over-estimating. Null when unknown. */
  biasRatio: number | null;
  /** Signed percentage the user is off by (e.g. +30 = tasks run 30% longer). Null when unknown. */
  biasPercent: number | null;
  direction: "under" | "over" | "accurate" | "unknown";
  confidence: Confidence;
  evidence: Evidence;
  /** Human, evidence-grounded summary. Empty when unknown. */
  headline: string;
  detail: string;
  /** Multiply a fresh estimate by this to get the system-adjusted expectation (1 when unknown). */
  adjustmentFactor: number;
}

const MIN_SAMPLE = 3;

/** How consistent the ratios are (1 = identical), from the coefficient of variation. */
function consistencyOf(ratios: number[], mean: number): number {
  if (ratios.length < 2 || mean === 0) return ratios.length >= 1 ? 0.6 : 0;
  const variance = ratios.reduce((s, r) => s + (r - mean) * (r - mean), 0) / ratios.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(1, 1 - cv));
}

/** Analyze estimation behaviour from real completed-task pairs. */
export function analyzeEstimation(pairs: EstimatePair[], now: Date): EstimationInsight {
  const valid = pairs.filter((p) => p.estimateMinutes > 0 && p.actualMinutes > 0);
  const unknown = (): EstimationInsight => ({
    sampleSize: valid.length,
    biasRatio: null,
    biasPercent: null,
    direction: "unknown",
    confidence: computeConfidence({
      observations: valid.length,
      consistency: 0,
      timeSpanDays: 0,
      contradictions: 0,
      recencyDays: 0,
    }),
    evidence: {
      observations: valid.length,
      timeSpanDays: 0,
      source: "implicit",
      detail: `${valid.length} task${valid.length === 1 ? "" : "s"} with an estimate and a recorded actual`,
    },
    headline: "",
    detail: "Not enough estimated-and-tracked tasks yet to learn your estimation pattern.",
    adjustmentFactor: 1,
  });

  if (valid.length < MIN_SAMPLE) return unknown();

  const ratios = valid.map((p) => p.actualMinutes / p.estimateMinutes);
  const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length;

  const times = valid.map((p) => new Date(p.at).getTime()).sort((a, b) => a - b);
  const timeSpanDays = (times[times.length - 1]! - times[0]!) / 86_400_000;
  const recencyDays = (now.getTime() - times[times.length - 1]!) / 86_400_000;
  const consistency = consistencyOf(ratios, mean);
  // A ratio far from the mean contradicts the learned bias.
  const contradictions = ratios.filter((r) => Math.abs(r - mean) / mean > 0.5).length;

  const confidence = computeConfidence({
    observations: valid.length,
    consistency,
    timeSpanDays,
    contradictions,
    recencyDays,
  });

  const biasPercent = Math.round((mean - 1) * 100);
  const direction: EstimationInsight["direction"] =
    Math.abs(biasPercent) <= 10 ? "accurate" : mean > 1 ? "under" : "over";

  const evidence: Evidence = {
    observations: valid.length,
    timeSpanDays: Math.round(timeSpanDays),
    source: "implicit",
    detail: `${valid.length} tasks with an estimate and a recorded actual over ${Math.round(timeSpanDays)} days`,
  };

  let headline: string;
  let detail: string;
  if (direction === "accurate") {
    headline = "Your time estimates are usually accurate";
    detail = `Across ${valid.length} tracked tasks, actual time landed within ~10% of your estimate.`;
  } else if (direction === "under") {
    headline = `Your tasks usually run ${Math.abs(biasPercent)}% longer than estimated`;
    detail = `Across ${valid.length} tracked tasks, actual time averaged ${Math.round(mean * 100)}% of your estimate — worth padding future estimates.`;
  } else {
    headline = `Your tasks usually finish ${Math.abs(biasPercent)}% faster than estimated`;
    detail = `Across ${valid.length} tracked tasks, actual time averaged ${Math.round(mean * 100)}% of your estimate.`;
  }

  return {
    sampleSize: valid.length,
    biasRatio: Math.round(mean * 100) / 100,
    biasPercent,
    direction,
    confidence,
    evidence,
    headline,
    detail,
    // Only adjust planning once we're reasonably confident; otherwise trust the user.
    adjustmentFactor: confidence.level === "high" || confidence.level === "very_high" ? mean : 1,
  };
}
