import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  insertNote: vi.fn(),
  getNote: vi.fn(),
  updateNoteRow: vi.fn(),
  insertWiki: vi.fn(),
  getWiki: vi.fn(),
  updateWikiRow: vi.fn(),
  insertCard: vi.fn(),
  getCard: vi.fn(),
  updateCardRow: vi.fn(),
  insertReview: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({
  insertNote: h.insertNote,
  getNote: h.getNote,
  updateNoteRow: h.updateNoteRow,
  insertWiki: h.insertWiki,
  getWiki: h.getWiki,
  updateWikiRow: h.updateWikiRow,
  insertCard: h.insertCard,
  getCard: h.getCard,
  updateCardRow: h.updateCardRow,
  insertReview: h.insertReview,
}));

import { createNote, createWiki, reviewCard, updateNote } from "./service";
import { makeDeckCard, makeNote } from "@myos/core/knowledge";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.insertNote.mockImplementation((_db, n) => Promise.resolve(n));
  h.insertWiki.mockImplementation((_db, w) => Promise.resolve(w));
  h.updateNoteRow.mockImplementation((_db, _id, n) => Promise.resolve(n));
  h.updateCardRow.mockImplementation((_db, c) => Promise.resolve(c));
  h.insertReview.mockResolvedValue({});
});

describe("knowledge service", () => {
  it("createNote parses wiki links + tags via the engine", async () => {
    const note = await createNote(db, { content: "# Deep Nets\nSee [[Backprop]] #ml" });
    expect(note.title).toBe("Deep Nets");
    expect(note.linkedTitles).toEqual(["Backprop"]);
    expect(note.tags).toContain("ml");
    expect(h.insertNote).toHaveBeenCalledOnce();
  });

  it("createWiki derives a slug", async () => {
    const page = await createWiki(db, { title: "Machine Learning" });
    expect(page.slug).toBe("machine-learning");
  });

  it("updateNote reparses links after an edit", async () => {
    h.getNote.mockResolvedValue(makeNote({ id: "n1", content: "old" }));
    const updated = await updateNote(db, "n1", { content: "new [[Link]]" });
    expect(updated!.linkedTitles).toEqual(["Link"]);
  });

  it("updateNote returns null for a missing note", async () => {
    h.getNote.mockResolvedValue(null);
    expect(await updateNote(db, "missing", { content: "x" })).toBeNull();
  });

  it("reviewCard applies the scheduler + logs history", async () => {
    h.getCard.mockResolvedValue(
      makeDeckCard({ id: "card1", state: "learning", intervalStep: 1, streak: 1 }),
    );
    const next = await reviewCard(db, "card1", "good");
    expect(next!.intervalStep).toBe(2);
    expect(h.updateCardRow).toHaveBeenCalledOnce();
    expect(h.insertReview).toHaveBeenCalledOnce();
    const logged = h.insertReview.mock.calls[0]![1];
    expect(logged.grade).toBe("good");
    expect(logged.fromState).toBe("learning");
  });

  it("reviewCard returns null for a missing card", async () => {
    h.getCard.mockResolvedValue(null);
    expect(await reviewCard(db, "missing", "good")).toBeNull();
    expect(h.insertReview).not.toHaveBeenCalled();
  });
});
