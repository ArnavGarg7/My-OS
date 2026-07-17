import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  bookRowToBook,
  cardRowToCard,
  courseRowToCourse,
  linkRowToLink,
  noteRowToNote,
  researchRowToResearch,
  reviewRowToReview,
  wikiRowToWiki,
} from "./mapper";
import type {
  BookRow,
  CourseRow,
  FlashcardRow,
  KnowledgeLinkRow,
  KnowledgeNoteRow,
  MemoryReviewRow,
  ResearchProjectRow,
  WikiPageRow,
} from "@myos/db/schema";

const D = (s: string) => new Date(s);

describe("knowledge mappers", () => {
  it("maps a note row", () => {
    const row: KnowledgeNoteRow = {
      id: "n1",
      title: "T",
      content: "c",
      tags: ["a"],
      linkedTitles: ["X"],
      archived: false,
      pinned: true,
      createdAt: D("2026-07-10T09:00:00Z"),
      updatedAt: D("2026-07-14T09:00:00Z"),
    };
    const n = noteRowToNote(row);
    expect(n.title).toBe("T");
    expect(n.pinned).toBe(true);
    expect(n.createdAt).toBe("2026-07-10T09:00:00.000Z");
  });

  it("maps a wiki row with slug", () => {
    const row: WikiPageRow = {
      id: "w1",
      title: "Linear Algebra",
      slug: "linear-algebra",
      content: "",
      tags: [],
      linkedTitles: [],
      createdAt: D("2026-07-01T09:00:00Z"),
      updatedAt: D("2026-07-12T09:00:00Z"),
    };
    expect(wikiRowToWiki(row).slug).toBe("linear-algebra");
  });

  it("maps a book row with null dates", () => {
    const row: BookRow = {
      id: "b1",
      title: "DL",
      author: "G",
      status: "reading",
      totalPages: 800,
      currentPage: 200,
      rating: null,
      notes: "",
      highlights: [],
      minutesRead: 600,
      startedAt: D("2026-06-15T09:00:00Z"),
      finishedAt: null,
      createdAt: D("2026-06-15T09:00:00Z"),
      updatedAt: D("2026-07-13T09:00:00Z"),
    };
    const b = bookRowToBook(row);
    expect(b.finishedAt).toBeNull();
    expect(b.startedAt).toBe("2026-06-15T09:00:00.000Z");
  });

  it("maps course + research + card + review + link rows", () => {
    const course: CourseRow = {
      id: "c1",
      title: "CS229",
      provider: "Stanford",
      status: "in_progress",
      totalModules: 20,
      completedModules: 12,
      hoursSpent: 40,
      certificate: false,
      notes: "",
      createdAt: D("2026-06-01T09:00:00Z"),
      updatedAt: D("2026-07-13T09:00:00Z"),
    };
    expect(courseRowToCourse(course).completedModules).toBe(12);

    const research: ResearchProjectRow = {
      id: "r1",
      title: "RAG",
      question: "q",
      hypothesis: "h",
      status: "in_progress",
      sources: ["s"],
      experiments: [],
      conclusions: "",
      relatedNoteIds: ["n1"],
      createdAt: D("2026-06-20T09:00:00Z"),
      updatedAt: D("2026-07-14T09:00:00Z"),
    };
    expect(researchRowToResearch(research).relatedNoteIds).toEqual(["n1"]);

    const card: FlashcardRow = {
      id: "card1",
      deckId: "d1",
      front: "f",
      back: "b",
      state: "review",
      intervalStep: 2,
      streak: 1,
      dueAt: D("2026-07-14T09:00:00Z"),
      lastReviewedAt: null,
      createdAt: D("2026-06-01T09:00:00Z"),
      updatedAt: D("2026-07-07T09:00:00Z"),
    };
    expect(cardRowToCard(card).state).toBe("review");
    expect(cardRowToCard(card).lastReviewedAt).toBeNull();

    const review: MemoryReviewRow = {
      id: "mr1",
      cardId: "card1",
      grade: "good",
      fromState: "review",
      toState: "review",
      reviewedAt: D("2026-07-15T09:00:00Z"),
    };
    expect(reviewRowToReview(review).grade).toBe("good");

    const link: KnowledgeLinkRow = {
      id: "l1",
      sourceId: "n1",
      sourceType: "note",
      targetId: "w1",
      targetType: "wiki",
      kind: "references",
      createdAt: D("2026-07-10T09:00:00Z"),
    };
    expect(linkRowToLink(link).kind).toBe("references");
  });
});
