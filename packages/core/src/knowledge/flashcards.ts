import {
  MASTERY_REVIEWS_REQUIRED,
  REVIEW_INTERVALS,
  type FlashcardState,
  type ReviewGrade,
} from "./constants";
import type { Flashcard } from "./types";

/**
 * Flashcard engine (Sprint 4.1). PURE, rule-based spaced repetition — NO ML, no SM-2
 * fuzzing, no randomness. A card walks the fixed interval ladder [1,3,7,14,30,60,120]
 * and the state machine new → learning → review → mastered based only on the grade.
 * The same (card, grade, now) always produces the same next card + due date.
 */

const MAX_STEP = REVIEW_INTERVALS.length - 1;

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function clampStep(step: number): number {
  return Math.max(0, Math.min(MAX_STEP, step));
}

/** State after advancing, given the new interval step + streak. */
function nextState(step: number, streak: number): FlashcardState {
  if (step >= MAX_STEP && streak >= MASTERY_REVIEWS_REQUIRED) return "mastered";
  if (step >= 2) return "review";
  return "learning";
}

export interface ReviewOutcome {
  card: Flashcard;
  fromState: FlashcardState;
  toState: FlashcardState;
}

/** Apply a grade to a card at time `now`, returning the deterministic next card. */
export function reviewCard(card: Flashcard, grade: ReviewGrade, now: Date): ReviewOutcome {
  const fromState = card.state;
  const nowIso = now.toISOString();
  let step = card.intervalStep;
  let streak = card.streak;
  let toState: FlashcardState;

  switch (grade) {
    case "again":
      // Lapse: reset to the start of the ladder, demote, due tomorrow.
      step = 0;
      streak = 0;
      toState = "learning";
      break;
    case "hard":
      // Hold position; short re-exposure. No streak gain.
      streak = 0;
      toState = step >= 2 ? "review" : "learning";
      break;
    case "good":
      step = clampStep(step + 1);
      streak = streak + 1;
      toState = nextState(step, streak);
      break;
    case "easy":
      step = clampStep(step + 2);
      streak = streak + 1;
      toState = nextState(step, streak);
      break;
  }

  const dueDays = grade === "again" ? 1 : (REVIEW_INTERVALS[step] ?? 1);
  const card2: Flashcard = {
    ...card,
    state: toState,
    intervalStep: step,
    streak,
    dueAt: addDays(nowIso, dueDays),
    lastReviewedAt: nowIso,
    updatedAt: nowIso,
  };
  return { card: card2, fromState, toState };
}

/** Cards due for review at `now` (dueAt <= now), most overdue first. */
export function dueCards(cards: Flashcard[], now: Date): Flashcard[] {
  const t = now.getTime();
  return cards
    .filter((c) => c.state !== "mastered" && new Date(c.dueAt).getTime() <= t)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

/** How many cards are overdue (dueAt strictly before start-of-today in the tz-naive sense). */
export function overdueCount(cards: Flashcard[], now: Date): number {
  return dueCards(cards, now).length;
}

/** A fresh card in the `new` state, due immediately. */
export function newCard(
  id: string,
  deckId: string,
  front: string,
  back: string,
  now: Date,
): Flashcard {
  const iso = now.toISOString();
  return {
    id,
    deckId,
    front,
    back,
    state: "new",
    intervalStep: 0,
    streak: 0,
    dueAt: iso,
    lastReviewedAt: null,
    createdAt: iso,
    updatedAt: iso,
  };
}

/** Deck-level counts by state. */
export function stateCounts(cards: Flashcard[]): Record<FlashcardState, number> {
  const counts: Record<FlashcardState, number> = {
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  };
  for (const c of cards) counts[c.state] += 1;
  return counts;
}
