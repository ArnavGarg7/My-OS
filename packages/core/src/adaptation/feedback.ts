/**
 * Feedback Engine (Sprint 6.5, spec §Feedback Engine). Every recommendation/proposal can receive
 * feedback; feedback deterministically updates personalization WEIGHTS (never business logic, never
 * the proposal itself). Positive feedback surfaces a subject more; negative suppresses it;
 * "ignore_similar" mutes it. Pure — no AI. Fully reproducible from the feedback log.
 */
import type { FeedbackRecord, FeedbackType, FeedbackWeights } from "./types";

/** Deterministic weight delta per feedback type. */
const DELTA: Record<FeedbackType, number> = {
  excellent: 0.5,
  helpful: 0.25,
  not_helpful: -0.25,
  wrong_timing: -0.1,
  incorrect_assumption: -0.3,
  ignore_similar: -1,
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Fold a feedback log into deterministic per-subject weights + a mute list. */
export function computeFeedbackWeights(feedback: readonly FeedbackRecord[]): FeedbackWeights {
  const bySubject: Record<string, number> = {};
  const muted = new Set<string>();
  // Chronological order so later feedback refines earlier (still fully deterministic).
  const ordered = [...feedback].sort((a, b) => a.at.localeCompare(b.at));
  for (const f of ordered) {
    bySubject[f.subject] = clamp((bySubject[f.subject] ?? 0) + DELTA[f.type], -1, 1);
    if (f.type === "ignore_similar") muted.add(f.subject);
  }
  return { bySubject, muted: [...muted].sort(), totalFeedback: feedback.length };
}

/** Summarize a feedback log by type (for reviews). */
export function summarizeFeedback(
  feedback: readonly FeedbackRecord[],
): { type: FeedbackType; count: number }[] {
  const counts = new Map<FeedbackType, number>();
  for (const f of feedback) counts.set(f.type, (counts.get(f.type) ?? 0) + 1);
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/** Recommendation quality 0..1 — share of positive feedback (spec §Weekly Review). */
export function recommendationQuality(feedback: readonly FeedbackRecord[]): number {
  if (feedback.length === 0) return 0;
  const positive = feedback.filter((f) => f.type === "helpful" || f.type === "excellent").length;
  return Math.round((positive / feedback.length) * 100) / 100;
}
