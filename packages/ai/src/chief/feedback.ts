/**
 * User Feedback Learning (Sprint 5.2). Every recommendation records accepted / modified / rejected
 * / ignored. Feedback refines the Personal Profile, nudges Provider Policy, and steers prompts —
 * it NEVER changes deterministic calculations. Pure summarization + steering derivation here.
 */
import type { Feedback, FeedbackOutcome } from "./types";

export interface FeedbackSummary {
  accepted: number;
  modified: number;
  rejected: number;
  ignored: number;
  total: number;
  /** Accepted / total, 0 when empty. */
  acceptanceRate: number;
}

export function summarizeFeedback(feedbacks: readonly Feedback[]): FeedbackSummary {
  const counts: Record<FeedbackOutcome, number> = {
    accepted: 0,
    modified: 0,
    rejected: 0,
    ignored: 0,
  };
  for (const f of feedbacks) counts[f.outcome] += 1;
  const total = feedbacks.length;
  return {
    ...counts,
    total,
    acceptanceRate: total === 0 ? 0 : Math.round((counts.accepted / total) * 100) / 100,
  };
}

export interface Steering {
  /** Prompt steering hints appended to the dynamic zone (never to the frozen system prompt). */
  hints: string[];
  /** Whether to prefer the cheaper/faster policy tier (low acceptance → stay conservative). */
  preferConservative: boolean;
}

/** Derive prompt/policy steering from feedback. Deterministic; changes no business logic. */
export function deriveSteering(feedbacks: readonly Feedback[]): Steering {
  const summary = summarizeFeedback(feedbacks);
  const hints: string[] = [];
  if (summary.rejected > summary.accepted && summary.total >= 3) {
    hints.push(
      "The user often rejects recommendations — be more conservative and explain the trade-offs explicitly.",
    );
  }
  if (summary.modified > 0) {
    hints.push(
      "The user frequently edits proposals — present them as starting points, not final answers.",
    );
  }
  return { hints, preferConservative: summary.total >= 3 && summary.acceptanceRate < 0.4 };
}
