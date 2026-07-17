import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  listNotes: vi.fn(),
  listWiki: vi.fn(),
  listBooks: vi.fn(),
  listCourses: vi.fn(),
  listResearch: vi.fn(),
  listCards: vi.fn(),
  listReviews: vi.fn(),
  listLinks: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import { search } from "./search";
import { graph, nodeNeighborhood } from "./graph";
import { daily, resurfacing } from "./review";
import { portfolio, signals, statistics, summary } from "./summary";
import { makeNote } from "@myos/core/knowledge";

const db = {} as never;

function empty() {
  h.listNotes.mockResolvedValue([]);
  h.listWiki.mockResolvedValue([]);
  h.listBooks.mockResolvedValue([]);
  h.listCourses.mockResolvedValue([]);
  h.listResearch.mockResolvedValue([]);
  h.listCards.mockResolvedValue([]);
  h.listReviews.mockResolvedValue([]);
  h.listLinks.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  empty();
});

describe("knowledge derivations on empty state", () => {
  it("search returns nothing", async () => {
    expect(await search(db, "anything")).toEqual([]);
  });
  it("graph is empty", async () => {
    const g = await graph(db);
    expect(g.nodes).toEqual([]);
    expect(g.edges).toEqual([]);
  });
  it("daily review has zero due", async () => {
    expect((await daily(db)).dueCount).toBe(0);
  });
  it("resurfacing is empty", async () => {
    expect(await resurfacing(db)).toEqual([]);
  });
  it("summary is all-zero", async () => {
    const s = await summary(db);
    expect(s.totalNotes).toBe(0);
    expect(s.dueFlashcards).toBe(0);
    expect(s.activeBook).toBeNull();
  });
  it("portfolio is all-zero", async () => {
    const p = await portfolio(db);
    expect(p.totalNotes).toBe(0);
    expect(p.graphSize).toBe(0);
    expect(p.mostConnectedTopic).toBeNull();
  });
  it("statistics is all-zero", async () => {
    const st = await statistics(db);
    expect(st.booksCompleted).toBe(0);
    expect(st.retention).toBe(0);
  });
  it("signals are all-false/zero", async () => {
    const sig = await signals(db);
    expect(sig.flashcardsOverdue).toBe(0);
    expect(sig.bookStalled).toBe(false);
    expect(sig.researchInactive).toBe(false);
  });
});

describe("knowledge graph neighborhood", () => {
  it("returns just the node when isolated", async () => {
    h.listNotes.mockResolvedValue([makeNote({ id: "solo", title: "Solo", linkedTitles: [] })]);
    const n = await nodeNeighborhood(db, "solo");
    expect(n.nodes.map((x) => x.id)).toEqual(["solo"]);
  });

  it("excludes archived notes from the graph", async () => {
    h.listNotes.mockResolvedValue([makeNote({ id: "arch", archived: true })]);
    expect((await graph(db)).nodes).toEqual([]);
  });
});
