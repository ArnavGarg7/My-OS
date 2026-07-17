import { DAILY_REVIEW_LIMIT } from "./constants";
import type { Flashcard, MemoryReview } from "./types";
import { dueCards } from "./flashcards";

/**
 * Daily review scheduling (Sprint 4.1). Rule-based selection of which flashcards to
 * surface today, and derived retention/completion from the review history. Deterministic.
 */

export interface DailyReview {
  cards: Flashcard[];
  dueCount: number;
  newCount: number;
}

/** The cards to review today: all due cards, capped, new cards last. */
export function dailyReview(
  cards: Flashcard[],
  now: Date,
  limit = DAILY_REVIEW_LIMIT,
): DailyReview {
  const due = dueCards(cards, now);
  const newOnes = due.filter((c) => c.state === "new");
  const rest = due.filter((c) => c.state !== "new");
  const ordered = [...rest, ...newOnes].slice(0, limit);
  return { cards: ordered, dueCount: due.length, newCount: newOnes.length };
}

function isSameDay(a: string, b: Date): boolean {
  const d = new Date(a);
  return (
    d.getUTCFullYear() === b.getUTCFullYear() &&
    d.getUTCMonth() === b.getUTCMonth() &&
    d.getUTCDate() === b.getUTCDate()
  );
}

/** How many reviews were logged today. */
export function reviewsToday(history: MemoryReview[], now: Date): number {
  return history.filter((r) => isSameDay(r.reviewedAt, now)).length;
}

/** Retention: percent of reviews graded good/easy over the given history window. */
export function retention(history: MemoryReview[]): number {
  if (history.length === 0) return 0;
  const good = history.filter((r) => r.grade === "good" || r.grade === "easy").length;
  return Math.round((good / history.length) * 100);
}

/** Completion: percent of today's due cards that were actually reviewed. */
export function reviewCompletion(cards: Flashcard[], history: MemoryReview[], now: Date): number {
  const due = dailyReview(cards, now).dueCount;
  if (due === 0) return 100;
  const reviewed = reviewsToday(history, now);
  return Math.min(100, Math.round((reviewed / due) * 100));
}
