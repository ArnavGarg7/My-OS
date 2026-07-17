import { describe, expect, it } from "vitest";
import {
  activeNotes,
  notesByTag,
  pinnedNotes,
  recentNotes,
  search,
  tableOfContents,
  tagCloud,
  wordCount,
  type SearchCollections,
} from "../index";
import { makeBook, makeCourse, makeNote, makeResearch, makeWiki } from "../fixtures";

const NOW = new Date("2026-07-15T12:00:00.000Z");

const collections: SearchCollections = {
  notes: [
    makeNote({
      id: "n1",
      title: "Machine Learning",
      content: "# Machine Learning\ndeep nets",
      tags: ["ai"],
    }),
    makeNote({ id: "n2", title: "Cooking", content: "pasta recipes", tags: ["food"] }),
  ],
  wiki: [makeWiki({ id: "w1", title: "Linear Algebra", content: "vectors and matrices" })],
  books: [makeBook({ id: "b1", title: "Deep Learning", notes: "backprop" })],
  courses: [makeCourse({ id: "c1", title: "CS229", notes: "machine learning course" })],
  research: [makeResearch({ id: "r1", title: "RAG", question: "grounding" })],
};

describe("knowledge search", () => {
  it("ranks exact title highest", () => {
    const hits = search("Machine Learning", collections, NOW);
    expect(hits[0]!.id).toBe("n1");
    expect(hits[0]!.reason).toBe("Exact title");
  });

  it("is deterministic", () => {
    expect(search("learning", collections, NOW)).toEqual(search("learning", collections, NOW));
  });

  it("matches wiki titles", () => {
    const hits = search("Linear Algebra", collections, NOW);
    expect(hits[0]!.type).toBe("wiki");
  });

  it("matches tags", () => {
    const hits = search("ai", collections, NOW);
    expect(hits.some((h) => h.id === "n1")).toBe(true);
  });

  it("matches book + course + research titles", () => {
    expect(search("Deep Learning", collections, NOW).some((h) => h.type === "book")).toBe(true);
    expect(search("CS229", collections, NOW).some((h) => h.type === "course")).toBe(true);
    expect(search("RAG", collections, NOW).some((h) => h.type === "research")).toBe(true);
  });

  it("returns nothing for a blank query", () => {
    expect(search("   ", collections, NOW)).toEqual([]);
  });

  it("excludes archived notes", () => {
    const c = { ...collections, notes: [makeNote({ id: "n1", title: "Secret", archived: true })] };
    expect(search("Secret", c, NOW)).toEqual([]);
  });

  it("respects the limit", () => {
    expect(search("learning", collections, NOW, 1).length).toBeLessThanOrEqual(1);
  });
});

describe("notes selectors", () => {
  const notes = [
    makeNote({ id: "a", pinned: true, updatedAt: "2026-07-14T00:00:00Z", tags: ["ai"] }),
    makeNote({ id: "b", pinned: false, updatedAt: "2026-07-15T00:00:00Z", tags: ["ai", "math"] }),
    makeNote({ id: "c", archived: true }),
  ];

  it("filters active + pinned", () => {
    expect(activeNotes(notes)).toHaveLength(2);
    expect(pinnedNotes(notes).map((n) => n.id)).toEqual(["a"]);
  });

  it("sorts recent notes", () => {
    expect(recentNotes(notes)[0]!.id).toBe("b");
  });

  it("filters by tag + builds a tag cloud", () => {
    expect(notesByTag(notes, "math").map((n) => n.id)).toEqual(["b"]);
    expect(tagCloud(notes)[0]).toEqual({ tag: "ai", count: 2 });
  });

  it("counts words + builds a TOC", () => {
    const n = makeNote({ content: "# H1\nsome words here\n## H2" });
    expect(wordCount(n)).toBeGreaterThan(0);
    expect(tableOfContents(n)).toHaveLength(2);
  });
});
