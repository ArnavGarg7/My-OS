import { describe, expect, it } from "vitest";
import {
  activeBooks,
  activeCourses,
  activeResearch,
  bookProgress,
  buildPortfolio,
  buildStatistics,
  courseProgress,
  isBookStalled,
  learningHours,
  readingVelocity,
  resurface,
} from "../index";
import {
  makeBook,
  makeCourse,
  makeDeckCard,
  makeLink,
  makeNote,
  makeResearch,
  makeReview,
  makeWiki,
} from "../fixtures";

const NOW = new Date("2026-07-15T12:00:00.000Z");

describe("learning progress", () => {
  it("computes book + course progress", () => {
    expect(bookProgress(makeBook({ currentPage: 200, totalPages: 800 }))).toBe(25);
    expect(bookProgress(makeBook({ totalPages: 0, status: "finished" }))).toBe(100);
    expect(courseProgress(makeCourse({ completedModules: 12, totalModules: 20 }))).toBe(60);
  });

  it("filters active items", () => {
    expect(
      activeBooks([makeBook({ status: "reading" }), makeBook({ status: "finished" })]),
    ).toHaveLength(1);
    expect(activeCourses([makeCourse({ status: "in_progress" })])).toHaveLength(1);
    expect(activeResearch([makeResearch({ status: "in_progress" })])).toHaveLength(1);
  });

  it("computes reading velocity", () => {
    const v = readingVelocity(
      [makeBook({ startedAt: "2026-07-05T00:00:00Z", currentPage: 100 })],
      NOW,
    );
    expect(v).toBeGreaterThan(0);
  });

  it("sums learning hours", () => {
    expect(learningHours([makeBook({ minutesRead: 120 })], [makeCourse({ hoursSpent: 3 })])).toBe(
      5,
    );
  });

  it("detects a stalled book", () => {
    expect(
      isBookStalled(makeBook({ status: "reading", updatedAt: "2026-07-01T00:00:00Z" }), NOW),
    ).toBe(true);
    expect(
      isBookStalled(makeBook({ status: "reading", updatedAt: "2026-07-14T00:00:00Z" }), NOW),
    ).toBe(false);
  });
});

describe("memory resurfacing", () => {
  it("surfaces forgotten notes, stale research + unopened books deterministically", () => {
    const input = {
      notes: [
        makeNote({
          id: "old",
          title: "Old Note",
          updatedAt: "2026-05-01T00:00:00Z",
          linkedTitles: [],
        }),
      ],
      wiki: [makeWiki({ id: "w", title: "Hub" })],
      books: [makeBook({ id: "b", status: "want_to_read", updatedAt: "2026-06-01T00:00:00Z" })],
      research: [
        makeResearch({ id: "r", status: "in_progress", updatedAt: "2026-06-20T00:00:00Z" }),
      ],
      now: NOW,
    };
    const a = resurface(input);
    const b = resurface(input);
    expect(a).toEqual(b); // deterministic
    expect(a.some((x) => x.reason === "forgotten_knowledge")).toBe(true);
    expect(a.some((x) => x.reason === "stale_research")).toBe(true);
    expect(a.some((x) => x.reason === "unopened_book")).toBe(true);
  });

  it("respects the limit", () => {
    const notes = Array.from({ length: 10 }, (_, i) =>
      makeNote({
        id: `n${i}`,
        title: `N${i}`,
        updatedAt: "2026-04-01T00:00:00Z",
        linkedTitles: [],
      }),
    );
    expect(resurface({ notes, wiki: [], books: [], research: [], now: NOW }, 3)).toHaveLength(3);
  });

  it("returns nothing when everything is fresh", () => {
    const fresh = {
      notes: [makeNote({ updatedAt: "2026-07-14T00:00:00Z" })],
      wiki: [],
      books: [makeBook({ updatedAt: "2026-07-14T00:00:00Z" })],
      research: [makeResearch({ updatedAt: "2026-07-14T00:00:00Z" })],
      now: NOW,
    };
    expect(resurface(fresh)).toEqual([]);
  });
});

describe("portfolio + statistics", () => {
  const input = {
    notes: [makeNote()],
    wiki: [makeWiki()],
    books: [makeBook({ status: "finished", finishedAt: "2026-07-10T00:00:00Z" })],
    courses: [makeCourse({ status: "completed" })],
    flashcards: [makeDeckCard()],
    research: [makeResearch()],
    links: [makeLink()],
    now: NOW,
  };

  it("builds a derived portfolio", () => {
    const p = buildPortfolio(input);
    expect(p.totalNotes).toBe(1);
    expect(p.wikiPages).toBe(1);
    expect(p.graphSize).toBeGreaterThan(0);
    expect(p.learningHours).toBeGreaterThan(0);
  });

  it("builds learning statistics", () => {
    const s = buildStatistics({
      notes: input.notes,
      wiki: input.wiki,
      books: input.books,
      courses: input.courses,
      flashcards: input.flashcards,
      reviews: [makeReview({ reviewedAt: "2026-07-15T09:00:00Z" })],
      now: NOW,
    });
    expect(s.booksCompleted).toBe(1);
    expect(s.coursesFinished).toBe(1);
    expect(s.flashcardsReviewed).toBe(1);
    expect(s.topicsLearned).toBeGreaterThan(0);
  });
});
