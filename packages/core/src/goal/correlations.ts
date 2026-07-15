import type { GoalReview } from "./types";

/**
 * Goal correlations (Sprint 2.12). Pure descriptive statistics + a rule-based
 * forecast-accuracy measure comparing a review's projected progress to what was
 * actually achieved by the next review. Only statistics, no AI.
 */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i]! - mx;
    const b = y[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, num / denom));
}

/**
 * Mean absolute progress change across consecutive reviews — a deterministic
 * proxy for review-over-review momentum.
 */
export function reviewMomentum(reviews: GoalReview[]): number {
  const sorted = [...reviews].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  if (sorted.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total += sorted[i]!.progressSnapshot - sorted[i - 1]!.progressSnapshot;
  }
  return Math.round((total / (sorted.length - 1)) * 10) / 10;
}
