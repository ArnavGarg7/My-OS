import type { ReviewPeriod } from "./constants";
import { goalProgress } from "./progress";
import type { Goal, GoalReview } from "./types";

/**
 * Review engine (Sprint 2.12). Rule-based period reviews for a goal — a
 * deterministic summary + a progress snapshot. Journal remains the canonical
 * writing surface; these are the structured goal-side records.
 */
export function createReview(
  goal: Goal,
  period: ReviewPeriod,
  summary: string,
  now: Date,
): GoalReview {
  return {
    id: "",
    goalId: goal.id,
    reviewPeriod: period,
    summary: summary.trim() || defaultSummary(goal, period),
    progressSnapshot: goalProgress(goal).overall,
    reviewedAt: now.toISOString(),
  };
}

export function defaultSummary(goal: Goal, period: ReviewPeriod): string {
  const p = goalProgress(goal);
  const label = period.charAt(0).toUpperCase() + period.slice(1);
  return `${label} review of "${goal.title}": ${p.overall}% overall (${p.completedObjectives}/${p.totalObjectives} objectives complete).`;
}

export function reviewsForPeriod(reviews: GoalReview[], period: ReviewPeriod): GoalReview[] {
  return reviews
    .filter((r) => r.reviewPeriod === period)
    .sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
}

export function latestReview(reviews: GoalReview[]): GoalReview | null {
  if (reviews.length === 0) return null;
  return [...reviews].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt)).at(-1)!;
}

/** Progress change since the previous review of the same period. */
export function progressDelta(reviews: GoalReview[], period: ReviewPeriod): number | null {
  const periodReviews = reviewsForPeriod(reviews, period);
  if (periodReviews.length < 2) return null;
  const last = periodReviews.at(-1)!;
  const prev = periodReviews.at(-2)!;
  return last.progressSnapshot - prev.progressSnapshot;
}
