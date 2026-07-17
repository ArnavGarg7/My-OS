import { describe, expect, it } from "vitest";
import {
  FLASHCARD_STATES,
  KNOWLEDGE_TYPES,
  LINK_KINDS,
  REVIEW_GRADES,
  averageConnections,
  bookProgress,
  buildGraph,
  buildPortfolio,
  buildStatistics,
  callouts,
  checklist,
  codeBlockCount,
  courseProgress,
  dailyReview,
  dueCards,
  hasTable,
  headings,
  inferTitle,
  mergeTags,
  parseTags,
  parseWikiLinks,
  reviewCard,
  search,
  slugify,
  titleIndex,
  toPlainText,
  type SearchCollections,
} from "../index";
import {
  FIXED_NOW,
  makeBook,
  makeCourse,
  makeDeckCard,
  makeNote,
  makeResearch,
  makeWiki,
} from "../fixtures";

/* Markdown edge cases */
describe("markdown edge cases", () => {
  it("handles empty input everywhere", () => {
    expect(headings("")).toEqual([]);
    expect(inferTitle("")).toBe("");
    expect(codeBlockCount("")).toBe(0);
    expect(hasTable("")).toBe(false);
    expect(checklist("")).toEqual({ total: 0, done: 0 });
    expect(callouts("")).toEqual([]);
    expect(toPlainText("")).toBe("");
  });
  it("ignores headings deeper than h6", () => {
    expect(headings("####### too deep")).toEqual([]);
  });
  it("counts multiple checklists", () => {
    expect(checklist("- [ ] a\n- [x] b\n- [X] c")).toEqual({ total: 3, done: 2 });
  });
  it("extracts multiple callouts lowercased", () => {
    expect(callouts("> [!NOTE] a\n> [!Warning] b")).toEqual(["note", "warning"]);
  });
});

/* Wiki-link parsing edge cases */
describe("wiki-link parsing edge cases", () => {
  it("returns empty for no links", () => {
    expect(parseWikiLinks("plain text")).toEqual([]);
  });
  it("handles aliases + whitespace", () => {
    expect(parseWikiLinks("[[  Spaced Title  |alias]]")).toEqual(["Spaced Title"]);
  });
  it("parses tags with digits/underscores", () => {
    expect(parseTags("#ml_2024 #v2")).toEqual(["ml_2024", "v2"]);
  });
  it("merges explicit tags first", () => {
    expect(mergeTags(["First"], "#second #First")).toEqual(["first", "second"]);
  });
  it("slugs collapse punctuation", () => {
    expect(slugify("C++ & Rust!!")).toBe("c-rust");
  });
});

/* Flashcard state machine — exhaustive grades from each state */
describe("flashcard grade matrix", () => {
  for (const grade of REVIEW_GRADES) {
    it(`applies ${grade} deterministically from review`, () => {
      const card = makeDeckCard({ state: "review", intervalStep: 3, streak: 1 });
      const a = reviewCard(card, grade, FIXED_NOW);
      const b = reviewCard(card, grade, FIXED_NOW);
      expect(a.card).toEqual(b.card);
      expect(FLASHCARD_STATES).toContain(a.toState);
    });
  }
  it("new card graded good becomes learning", () => {
    const { toState } = reviewCard(
      makeDeckCard({ state: "new", intervalStep: 0, streak: 0 }),
      "good",
      FIXED_NOW,
    );
    expect(toState).toBe("learning");
  });
  it("dueCards is sorted by dueAt ascending", () => {
    const cards = [
      makeDeckCard({ id: "b", dueAt: "2026-07-12T00:00:00Z" }),
      makeDeckCard({ id: "a", dueAt: "2026-07-10T00:00:00Z" }),
    ];
    expect(dueCards(cards, FIXED_NOW).map((c) => c.id)).toEqual(["a", "b"]);
  });
  it("dailyReview caps at the limit", () => {
    const cards = Array.from({ length: 60 }, (_, i) =>
      makeDeckCard({ id: `c${i}`, state: "review", dueAt: "2026-07-10T00:00:00Z" }),
    );
    expect(dailyReview(cards, FIXED_NOW, 40).cards).toHaveLength(40);
  });
});

/* Search ranking */
describe("search ranking bands", () => {
  const base: SearchCollections = { notes: [], wiki: [], books: [], courses: [], research: [] };
  it("ranks exact title over body match", () => {
    const collections: SearchCollections = {
      ...base,
      notes: [
        makeNote({ id: "exact", title: "Vectors", content: "x" }),
        makeNote({ id: "body", title: "Other", content: "all about vectors here" }),
      ],
    };
    const hits = search("Vectors", collections, FIXED_NOW);
    expect(hits[0]!.id).toBe("exact");
  });
  it("includes a snippet + reason", () => {
    const collections: SearchCollections = {
      ...base,
      notes: [makeNote({ id: "n", title: "Alpha", content: "alpha content" })],
    };
    const hit = search("Alpha", collections, FIXED_NOW)[0]!;
    expect(hit.snippet.length).toBeGreaterThan(0);
    expect(hit.reason).toBeTruthy();
  });
});

/* Learning progress clamps */
describe("progress clamps", () => {
  it("book progress caps at 100", () => {
    expect(bookProgress(makeBook({ currentPage: 900, totalPages: 800 }))).toBe(100);
  });
  it("course progress caps at 100", () => {
    expect(courseProgress(makeCourse({ completedModules: 30, totalModules: 20 }))).toBe(100);
  });
});

/* Graph determinism + vocab */
describe("graph + vocab", () => {
  it("edges reference only known nodes", () => {
    const nodes = [{ id: "a", type: "note" as const, title: "A", linkedTitles: ["Ghost"] }];
    const g = buildGraph(nodes, []);
    expect(g.edges).toEqual([]);
  });
  it("titleIndex prefers wiki on collision", () => {
    const idx = titleIndex([makeNote({ title: "Dup" })], [makeWiki({ title: "Dup", id: "w" })]);
    expect(idx.get("dup")!.id).toBe("w");
  });
  it("all knowledge types + link kinds are covered", () => {
    expect(KNOWLEDGE_TYPES.length + LINK_KINDS.length).toBe(12);
  });
  it("average connections handles single node", () => {
    expect(
      averageConnections(buildGraph([{ id: "x", type: "note", title: "X", linkedTitles: [] }], [])),
    ).toBe(0);
  });
});

/* Portfolio + statistics empties */
describe("portfolio + statistics empties", () => {
  const empty = {
    notes: [],
    wiki: [],
    books: [],
    courses: [],
    flashcards: [],
    research: [],
    links: [],
    now: FIXED_NOW,
  };
  it("portfolio is all-zero when empty", () => {
    const p = buildPortfolio(empty);
    expect(p.totalNotes).toBe(0);
    expect(p.graphSize).toBe(0);
    expect(p.mostConnectedTopic).toBeNull();
  });
  it("statistics is all-zero when empty", () => {
    const s = buildStatistics({
      notes: [],
      wiki: [],
      books: [],
      courses: [],
      flashcards: [],
      reviews: [],
      now: FIXED_NOW,
    });
    expect(s.booksCompleted).toBe(0);
    expect(s.retention).toBe(0);
    expect(s.topicsLearned).toBe(0);
  });
  it("counts topics from tags", () => {
    const s = buildStatistics({
      notes: [makeNote({ tags: ["ai", "ml"] })],
      wiki: [makeWiki({ tags: ["math"] })],
      books: [],
      courses: [],
      flashcards: [],
      reviews: [],
      now: FIXED_NOW,
    });
    expect(s.topicsLearned).toBe(3);
  });
  it("counts research projects in portfolio", () => {
    const p = buildPortfolio({ ...empty, research: [makeResearch()] });
    expect(p.researchProjects).toBe(1);
  });
});
