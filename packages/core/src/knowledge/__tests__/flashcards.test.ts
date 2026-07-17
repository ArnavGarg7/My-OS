import { describe, expect, it } from "vitest";
import {
  REVIEW_INTERVALS,
  dailyReview,
  dueCards,
  newCard,
  overdueCount,
  retention,
  reviewCard,
  reviewCompletion,
  reviewsToday,
  stateCounts,
} from "../index";
import { makeDeckCard, makeReview } from "../fixtures";

const NOW = new Date("2026-07-15T12:00:00.000Z");

describe("flashcard spaced repetition", () => {
  it("creates a new card due immediately", () => {
    const c = newCard("c1", "d1", "front", "back", NOW);
    expect(c.state).toBe("new");
    expect(c.intervalStep).toBe(0);
    expect(new Date(c.dueAt).getTime()).toBe(NOW.getTime());
  });

  it("is deterministic: same input → same output", () => {
    const card = makeDeckCard({ state: "learning", intervalStep: 1, streak: 0 });
    const a = reviewCard(card, "good", NOW);
    const b = reviewCard(card, "good", NOW);
    expect(a.card).toEqual(b.card);
  });

  it("advances one step on good", () => {
    const card = makeDeckCard({ state: "learning", intervalStep: 1, streak: 1 });
    const { card: next } = reviewCard(card, "good", NOW);
    expect(next.intervalStep).toBe(2);
    expect(next.streak).toBe(2);
    expect(next.state).toBe("review");
  });

  it("advances two steps on easy", () => {
    const card = makeDeckCard({ state: "learning", intervalStep: 1, streak: 0 });
    const { card: next } = reviewCard(card, "easy", NOW);
    expect(next.intervalStep).toBe(3);
  });

  it("resets to the ladder start and demotes on again", () => {
    const card = makeDeckCard({ state: "review", intervalStep: 4, streak: 3 });
    const { card: next, toState } = reviewCard(card, "again", NOW);
    expect(next.intervalStep).toBe(0);
    expect(next.streak).toBe(0);
    expect(toState).toBe("learning");
    // due tomorrow
    expect(next.dueAt).toBe(new Date("2026-07-16T12:00:00.000Z").toISOString());
  });

  it("holds position on hard", () => {
    const card = makeDeckCard({ state: "review", intervalStep: 3, streak: 2 });
    const { card: next } = reviewCard(card, "hard", NOW);
    expect(next.intervalStep).toBe(3);
    expect(next.streak).toBe(0);
  });

  it("caps at the last interval + reaches mastered", () => {
    const last = REVIEW_INTERVALS.length - 1;
    const card = makeDeckCard({ state: "review", intervalStep: last, streak: 2 });
    const { card: next, toState } = reviewCard(card, "good", NOW);
    expect(next.intervalStep).toBe(last);
    expect(toState).toBe("mastered");
  });

  it("schedules due date from the interval ladder", () => {
    const card = makeDeckCard({ state: "learning", intervalStep: 0, streak: 0 });
    const { card: next } = reviewCard(card, "good", NOW); // step → 1 = 3 days
    const expected = new Date(NOW);
    expected.setUTCDate(expected.getUTCDate() + REVIEW_INTERVALS[1]!);
    expect(next.dueAt).toBe(expected.toISOString());
  });

  it("finds due cards, excluding mastered", () => {
    const cards = [
      makeDeckCard({ id: "a", dueAt: "2026-07-10T09:00:00Z" }),
      makeDeckCard({ id: "b", dueAt: "2026-07-20T09:00:00Z" }),
      makeDeckCard({ id: "c", state: "mastered", dueAt: "2026-07-01T09:00:00Z" }),
    ];
    expect(dueCards(cards, NOW).map((c) => c.id)).toEqual(["a"]);
    expect(overdueCount(cards, NOW)).toBe(1);
  });

  it("counts by state", () => {
    const counts = stateCounts([makeDeckCard({ state: "new" }), makeDeckCard({ state: "review" })]);
    expect(counts.new).toBe(1);
    expect(counts.review).toBe(1);
  });
});

describe("daily review", () => {
  it("selects due cards with new ones last, capped", () => {
    const cards = [
      makeDeckCard({ id: "new1", state: "new", dueAt: "2026-07-10T09:00:00Z" }),
      makeDeckCard({ id: "rev1", state: "review", dueAt: "2026-07-09T09:00:00Z" }),
    ];
    const dr = dailyReview(cards, NOW, 10);
    expect(dr.cards[dr.cards.length - 1]!.id).toBe("new1");
    expect(dr.dueCount).toBe(2);
    expect(dr.newCount).toBe(1);
  });

  it("computes reviews today, retention + completion", () => {
    const history = [
      makeReview({ id: "r1", grade: "good", reviewedAt: "2026-07-15T09:00:00Z" }),
      makeReview({ id: "r2", grade: "again", reviewedAt: "2026-07-15T10:00:00Z" }),
    ];
    expect(reviewsToday(history, NOW)).toBe(2);
    expect(retention(history)).toBe(50);
    const cards = [makeDeckCard({ dueAt: "2026-07-10T09:00:00Z" })];
    expect(reviewCompletion(cards, history, NOW)).toBe(100);
  });

  it("retention is 0 with no history", () => {
    expect(retention([])).toBe(0);
  });
});
