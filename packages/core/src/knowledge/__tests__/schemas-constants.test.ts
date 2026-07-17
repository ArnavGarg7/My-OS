import { describe, expect, it } from "vitest";
import {
  BOOK_STATUSES,
  COURSE_STATUSES,
  FLASHCARD_STATES,
  KNOWLEDGE_TYPES,
  LEARNING_STATUSES,
  LINK_KINDS,
  RESURFACE_REASONS,
  RESURFACE_WEIGHTS,
  REVIEW_GRADES,
  REVIEW_INTERVALS,
  bookInputSchema,
  courseInputSchema,
  deckInputSchema,
  flashcardInputSchema,
  linkInputSchema,
  noteInputSchema,
  researchInputSchema,
  reviewCardSchema,
  searchSchema,
  updateNoteSchema,
  wikiInputSchema,
} from "../index";

describe("knowledge constants", () => {
  it("declares the entity + enum vocabularies", () => {
    expect(KNOWLEDGE_TYPES).toHaveLength(6);
    expect(FLASHCARD_STATES).toEqual(["new", "learning", "review", "mastered"]);
    expect(REVIEW_INTERVALS).toEqual([1, 3, 7, 14, 30, 60, 120]);
    expect(LINK_KINDS).toHaveLength(6);
    expect(REVIEW_GRADES).toEqual(["again", "hard", "good", "easy"]);
    expect(BOOK_STATUSES).toContain("reading");
    expect(COURSE_STATUSES).toContain("in_progress");
    expect(LEARNING_STATUSES).toContain("in_progress");
  });

  it("has a weight for every resurface reason", () => {
    for (const r of RESURFACE_REASONS) expect(RESURFACE_WEIGHTS[r]).toBeGreaterThan(0);
  });
});

describe("knowledge schemas", () => {
  it("validates a note input", () => {
    expect(noteInputSchema.safeParse({ title: "N", content: "x", tags: ["a"] }).success).toBe(true);
    expect(noteInputSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("validates a note update requiring a uuid id", () => {
    expect(updateNoteSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
    expect(
      updateNoteSchema.safeParse({ id: "11111111-1111-1111-1111-111111111111", pinned: true })
        .success,
    ).toBe(true);
  });

  it("validates wiki + book + course + research inputs", () => {
    expect(wikiInputSchema.safeParse({ title: "W" }).success).toBe(true);
    expect(bookInputSchema.safeParse({ title: "B", rating: 5 }).success).toBe(true);
    expect(bookInputSchema.safeParse({ title: "B", rating: 9 }).success).toBe(false);
    expect(courseInputSchema.safeParse({ title: "C", completedModules: 3 }).success).toBe(true);
    expect(researchInputSchema.safeParse({ title: "R", sources: ["a"] }).success).toBe(true);
  });

  it("validates deck + flashcard + review inputs", () => {
    expect(deckInputSchema.safeParse({ title: "D" }).success).toBe(true);
    const uuid = "11111111-1111-1111-1111-111111111111";
    expect(flashcardInputSchema.safeParse({ deckId: uuid, front: "f", back: "b" }).success).toBe(
      true,
    );
    expect(flashcardInputSchema.safeParse({ deckId: uuid, front: "", back: "b" }).success).toBe(
      false,
    );
    expect(reviewCardSchema.safeParse({ id: uuid, grade: "good" }).success).toBe(true);
    expect(reviewCardSchema.safeParse({ id: uuid, grade: "perfect" }).success).toBe(false);
  });

  it("validates link + search inputs", () => {
    const uuid = "11111111-1111-1111-1111-111111111111";
    expect(
      linkInputSchema.safeParse({
        sourceId: uuid,
        sourceType: "note",
        targetId: uuid,
        targetType: "wiki",
        kind: "references",
      }).success,
    ).toBe(true);
    expect(searchSchema.safeParse({ query: "x" }).success).toBe(true);
    expect(searchSchema.safeParse({ query: "" }).success).toBe(false);
  });
});
