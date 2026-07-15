import type { ReviewPeriod } from "./constants";
import { allWins, outstandingLesson } from "./reflections";
import { moodTrend } from "./mood";
import type { DailyReflection, JournalEntry, JournalReview } from "./types";

/**
 * Review engine (Sprint 2.10). Rule-based period reviews — a deterministic
 * summary assembled from the period's reflections + entries. No AI narratives.
 */
export function createReview(period: ReviewPeriod, summary: string, now: Date): JournalReview {
  return { id: "", period, summary: summary.trim(), createdAt: now.toISOString() };
}

/** A deterministic, rule-based summary line for a period. */
export function summarizeReview(
  period: ReviewPeriod,
  reflections: DailyReflection[],
  entries: JournalEntry[],
): string {
  const wins = allWins(reflections).length;
  const lesson = outstandingLesson(reflections);
  const mood = moodTrend(entries);
  const label = period.charAt(0).toUpperCase() + period.slice(1);
  const parts = [
    `${label} review: ${entries.length} entr${entries.length === 1 ? "y" : "ies"}, ${reflections.length} reflection${reflections.length === 1 ? "" : "s"}.`,
    wins > 0 ? `${wins} win${wins === 1 ? "" : "s"} recorded.` : null,
    mood.samples > 0 ? `Average mood ${mood.average.toFixed(1)}/5 (${mood.direction}).` : null,
    lesson ? `Key lesson: ${lesson}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

export function reviewsForPeriod(reviews: JournalReview[], period: ReviewPeriod): JournalReview[] {
  return reviews
    .filter((r) => r.period === period)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function latestReview(reviews: JournalReview[], period: ReviewPeriod): JournalReview | null {
  return reviewsForPeriod(reviews, period).at(-1) ?? null;
}
