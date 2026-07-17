import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  insertBook: vi.fn(),
  updateBookRow: vi.fn(),
  listBooks: vi.fn(),
  insertCourse: vi.fn(),
  updateCourseRow: vi.fn(),
  insertResearch: vi.fn(),
  updateResearchRow: vi.fn(),
  insertDeck: vi.fn(),
  insertCard: vi.fn(),
  insertLink: vi.fn(),
  listReviews: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import {
  createBook,
  createCard,
  createCourse,
  createDeck,
  createLink,
  createResearch,
  listBooks,
  listReviews,
  updateBook,
  updateCourse,
  updateResearch,
} from "./service";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.insertBook.mockImplementation((_db, v) => Promise.resolve({ id: "b1", ...v }));
  h.updateBookRow.mockImplementation((_db, id, v) => Promise.resolve({ id, ...v }));
  h.insertCourse.mockImplementation((_db, v) => Promise.resolve({ id: "c1", ...v }));
  h.updateCourseRow.mockImplementation((_db, id, v) => Promise.resolve({ id, ...v }));
  h.insertResearch.mockImplementation((_db, v) => Promise.resolve({ id: "r1", ...v }));
  h.updateResearchRow.mockImplementation((_db, id, v) => Promise.resolve({ id, ...v }));
  h.insertDeck.mockImplementation((_db, v) => Promise.resolve({ id: "d1", ...v }));
  h.insertCard.mockImplementation((_db, c) => Promise.resolve(c));
  h.insertLink.mockImplementation((_db, l) => Promise.resolve({ id: "l1", ...l }));
  h.listBooks.mockResolvedValue([]);
  h.listReviews.mockResolvedValue([]);
});

describe("knowledge learning trackers", () => {
  it("creates + updates a book", async () => {
    await createBook(db, { title: "DL" });
    expect(h.insertBook).toHaveBeenCalledWith(db, { title: "DL" });
    await updateBook(db, "b1", { currentPage: 300 });
    expect(h.updateBookRow).toHaveBeenCalledWith(db, "b1", { currentPage: 300 });
  });

  it("creates + updates a course", async () => {
    await createCourse(db, { title: "CS229" });
    expect(h.insertCourse).toHaveBeenCalled();
    await updateCourse(db, "c1", { completedModules: 13 });
    expect(h.updateCourseRow).toHaveBeenCalledWith(db, "c1", { completedModules: 13 });
  });

  it("creates + updates research", async () => {
    await createResearch(db, { title: "RAG" });
    expect(h.insertResearch).toHaveBeenCalled();
    await updateResearch(db, "r1", { status: "completed" });
    expect(h.updateResearchRow).toHaveBeenCalledWith(db, "r1", { status: "completed" });
  });

  it("creates a deck", async () => {
    const deck = await createDeck(db, { title: "Deck" });
    expect(deck.id).toBe("d1");
  });

  it("creates a flashcard in the new state via the engine", async () => {
    const card = await createCard(db, { deckId: "d1", front: "f", back: "b" });
    expect(card.state).toBe("new");
    expect(h.insertCard).toHaveBeenCalledOnce();
  });

  it("creates a link", async () => {
    const link = await createLink(db, {
      sourceId: "n1",
      sourceType: "note",
      targetId: "w1",
      targetType: "wiki",
      kind: "references",
    });
    expect(link.id).toBe("l1");
  });

  it("delegates list reads", async () => {
    await listBooks(db);
    await listReviews(db);
    expect(h.listBooks).toHaveBeenCalled();
    expect(h.listReviews).toHaveBeenCalled();
  });
});
