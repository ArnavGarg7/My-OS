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
import { backlinks, graph } from "./graph";
import { daily, resurfacing } from "./review";
import { portfolio, signals, statistics, summary } from "./summary";
import {
  makeBook,
  makeCourse,
  makeDeckCard,
  makeNote,
  makeResearch,
  makeReview,
  makeWiki,
} from "@myos/core/knowledge";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.listNotes.mockResolvedValue([makeNote()]);
  h.listWiki.mockResolvedValue([makeWiki()]);
  h.listBooks.mockResolvedValue([makeBook()]);
  h.listCourses.mockResolvedValue([makeCourse()]);
  h.listResearch.mockResolvedValue([makeResearch()]);
  h.listCards.mockResolvedValue([makeDeckCard({ dueAt: "2020-01-01T00:00:00Z" })]);
  h.listReviews.mockResolvedValue([makeReview()]);
  h.listLinks.mockResolvedValue([]);
});

describe("knowledge derivations", () => {
  it("search defers to the core ranker", async () => {
    const hits = await search(db, "Machine Learning");
    expect(hits[0]!.title).toBe("Machine Learning");
  });

  it("graph builds nodes + edges", async () => {
    const g = await graph(db);
    expect(g.nodes.length).toBeGreaterThan(0);
  });

  it("backlinks resolves for an existing entity", async () => {
    const view = await backlinks(db, makeNote().id);
    expect(view).not.toBeNull();
  });

  it("backlinks returns null for an unknown id", async () => {
    expect(await backlinks(db, "ghost")).toBeNull();
  });

  it("daily review surfaces due cards", async () => {
    const dr = await daily(db);
    expect(dr.dueCount).toBeGreaterThan(0);
  });

  it("resurfacing returns deterministic items", async () => {
    h.listNotes.mockResolvedValue([
      makeNote({ updatedAt: "2026-01-01T00:00:00Z", linkedTitles: [] }),
    ]);
    const a = await resurfacing(db);
    const b = await resurfacing(db);
    expect(a).toEqual(b);
  });

  it("summary + portfolio + statistics + signals derive from collections", async () => {
    expect((await summary(db)).totalNotes).toBe(1);
    expect((await portfolio(db)).wikiPages).toBe(1);
    expect((await statistics(db)).topicsLearned).toBeGreaterThanOrEqual(0);
    expect((await signals(db)).flashcardsOverdue).toBeGreaterThan(0);
  });
});
