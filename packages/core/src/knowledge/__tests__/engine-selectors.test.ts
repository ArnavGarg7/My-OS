import { describe, expect, it } from "vitest";
import { buildSummary, computeSignals, createKnowledgeEngine } from "../index";
import {
  FIXED_NOW,
  makeBook,
  makeCourse,
  makeDeckCard,
  makeNote,
  makeResearch,
  makeReview,
} from "../fixtures";

const engine = createKnowledgeEngine(
  (() => {
    let n = 0;
    return () => `id-${(n += 1)}`;
  })(),
  () => FIXED_NOW,
);

describe("KnowledgeEngine", () => {
  it("makes a note parsing links + tags + inferring title", () => {
    const note = engine.makeNote({ content: "# Deep Nets\nSee [[Backprop]] #ml", tags: ["ai"] });
    expect(note.title).toBe("Deep Nets");
    expect(note.linkedTitles).toEqual(["Backprop"]);
    expect(note.tags).toEqual(["ai", "ml"]);
    expect(note.id).toMatch(/^id-/);
  });

  it("falls back to an explicit title then Untitled", () => {
    expect(engine.makeNote({ title: "Explicit", content: "" }).title).toBe("Explicit");
    expect(engine.makeNote({ content: "" }).title).toBe("Untitled");
  });

  it("reparses a note on edit", () => {
    const note = engine.makeNote({ title: "N", content: "old" });
    const edited = engine.reparseNote(note, { content: "new [[Link]] #tag" });
    expect(edited.linkedTitles).toEqual(["Link"]);
    expect(edited.tags).toContain("tag");
  });

  it("makes a wiki page with a slug", () => {
    const page = engine.makeWiki({ title: "Machine Learning", content: "[[Stats]]" });
    expect(page.slug).toBe("machine-learning");
    expect(page.linkedTitles).toEqual(["Stats"]);
  });

  it("makes + reviews a flashcard", () => {
    const card = engine.makeCard("d1", "front", "back");
    expect(card.state).toBe("new");
    const { card: next } = engine.review(card, "good");
    expect(next.lastReviewedAt).toBe(FIXED_NOW.toISOString());
  });

  it("compares titles by identity", () => {
    expect(engine.sameTitle("Machine  Learning", "machine learning")).toBe(true);
  });
});

describe("knowledge signals + summary", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  it("computes decision signals", () => {
    const signals = computeSignals({
      notes: [makeNote()],
      books: [makeBook({ status: "reading", updatedAt: "2026-07-01T00:00:00Z" })],
      courses: [makeCourse()],
      research: [makeResearch({ status: "in_progress", updatedAt: "2026-06-20T00:00:00Z" })],
      flashcards: Array.from({ length: 25 }, (_, i) =>
        makeDeckCard({ id: `c${i}`, dueAt: "2026-07-10T00:00:00Z", state: "review" }),
      ),
      now,
    });
    expect(signals.flashcardsOverdue).toBe(25);
    expect(signals.bookStalled).toBe(true);
    expect(signals.researchInactive).toBe(true);
    expect(signals.learningGoalFalling).toBe(true);
  });

  it("builds a compact summary", () => {
    const summary = buildSummary({
      notes: [makeNote(), makeNote({ id: "n2" })],
      books: [makeBook({ status: "reading", title: "Deep Learning" })],
      courses: [],
      research: [makeResearch({ status: "in_progress", title: "RAG" })],
      flashcards: [makeDeckCard({ dueAt: "2026-07-10T00:00:00Z", state: "review" })],
      reviews: [makeReview({ reviewedAt: "2026-07-15T09:00:00Z" })],
      now,
    });
    expect(summary.totalNotes).toBe(2);
    expect(summary.dueFlashcards).toBe(1);
    expect(summary.activeBook).toBe("Deep Learning");
    expect(summary.activeResearch).toBe("RAG");
    expect(summary.reviewsToday).toBe(1);
  });
});
