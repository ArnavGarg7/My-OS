import type { ReviewPeriod } from "./constants";
import { attentionItems } from "./attention";
import { improvingAreas, lifeBalance } from "./life-areas";
import type { IntelligenceInput, LifeAreaView, ReviewSnapshot } from "./types";

/**
 * Review engine (Sprint 4.4). Composes a period review from the owned inputs and captures it
 * as an IMMUTABLE snapshot — once written, a review row is never recomputed, because it
 * records what the numbers WERE on the review date. Producing the snapshot is deterministic;
 * persisting it (as history) is the server's job.
 */

/** Build the snapshot content. The server stamps id/createdAt and stores it verbatim. */
export function buildReviewSnapshot(
  input: IntelligenceInput,
  period: ReviewPeriod,
  periodStart: string,
  now: Date,
): ReviewSnapshot {
  const balance = lifeBalance(input);
  const attention = attentionItems(input);
  return {
    period,
    periodStart,
    overall: balance.overall,
    areas: balance.areas,
    attention,
    highlights: reviewHighlights(input, balance.areas),
    createdAt: now.toISOString(),
  };
}

/** Deterministic highlight lines — the best area, the improving areas, the biggest risk. */
export function reviewHighlights(input: IntelligenceInput, areas: LifeAreaView[]): string[] {
  const out: string[] = [];
  const sorted = [...areas].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  if (best) out.push(`Strongest area: ${best.label} (${best.score})`);

  const rising = improvingAreas(areas);
  if (rising.length > 0) {
    out.push(`Improving: ${rising.map((a) => a.label).join(", ")}`);
  }

  const worst = sorted[sorted.length - 1];
  if (worst && worst.score < 50) out.push(`Needs work: ${worst.label} (${worst.score})`);

  const top = attentionItems(input)[0];
  if (top) out.push(`Top attention: ${top.title}`);

  if (input.goals.slipping > 0) out.push(`${input.goals.slipping} goal(s) slipping`);
  return out;
}

/** Is a given period review overdue? Owned "days since last review" drives it. */
export function reviewOverdue(input: IntelligenceInput, period: ReviewPeriod): boolean {
  const daysSince = input.reviewsDue[period];
  if (daysSince === null) return true; // never done
  const cadence: Record<ReviewPeriod, number> = {
    weekly: 7,
    monthly: 30,
    quarterly: 91,
    yearly: 365,
  };
  return daysSince >= cadence[period];
}

export function reviewsDueCount(input: IntelligenceInput): number {
  return (["weekly", "monthly", "quarterly", "yearly"] as ReviewPeriod[]).filter((p) =>
    reviewOverdue(input, p),
  ).length;
}
