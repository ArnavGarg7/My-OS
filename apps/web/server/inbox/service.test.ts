import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InboxItemRow } from "@myos/db/schema";

// InboxService is server-only; mock the DB boundary (repository) and verify the
// engine wiring + row→DTO mapping + duplicate detection passthrough.
const h = vi.hoisted(() => ({
  list: vi.fn(),
  listSearchable: vi.fn(),
  listRecent: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  countByStatus: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";
import { rowToItem, itemToColumns } from "./mapper";

const db = {} as never;

function itemRow(over: Partial<InboxItemRow> = {}): InboxItemRow {
  return {
    id: "i1",
    type: "text",
    title: "Buy milk",
    content: "grocery run",
    metadata: { contentHash: "abc" },
    status: "new",
    source: "quick_add",
    capturedAt: new Date("2026-07-07T06:00:00Z"),
    organizedAt: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date("2026-07-07T06:00:00Z"),
    updatedAt: new Date("2026-07-07T06:00:00Z"),
    ...over,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("mapper", () => {
  it("round-trips a row through DTO and back to columns", () => {
    const item = rowToItem(itemRow());
    expect(item.capturedAt).toBe("2026-07-07T06:00:00.000Z");
    const cols = itemToColumns(item);
    expect(cols.capturedAt).toBeInstanceOf(Date);
    expect(cols.title).toBe("Buy milk");
  });

  it("maps null timestamps to null", () => {
    const item = rowToItem(itemRow({ organizedAt: null }));
    expect(item.organizedAt).toBeNull();
  });
});

describe("capture", () => {
  it("inserts a new capture and returns it", async () => {
    h.listRecent.mockResolvedValue([]);
    h.insert.mockResolvedValue(itemRow({ id: "new1", title: "Fresh" }));

    const result = await service.capture(db, {
      type: "note",
      content: "Fresh",
      source: "quick_add",
    });

    expect(h.insert).toHaveBeenCalled();
    expect(result.item.id).toBe("new1");
    expect(result.duplicates).toEqual([]);
  });

  it("reports possible duplicates without deleting anything", async () => {
    // Existing item captured just now with a matching title → "same title" match.
    h.listRecent.mockResolvedValue([
      itemRow({ id: "existing", title: "same body", content: "same body", capturedAt: new Date() }),
    ]);
    h.insert.mockResolvedValue(itemRow({ id: "new2", content: "same body" }));

    const result = await service.capture(db, {
      type: "note",
      content: "same body",
      source: "quick_add",
    });

    expect(result.duplicates.some((d) => d.itemId === "existing")).toBe(true);
    expect(h.update).not.toHaveBeenCalled();
  });

  it("passes an explicit title through to the built item", async () => {
    h.listRecent.mockResolvedValue([]);
    let captured: unknown;
    h.insert.mockImplementation((_db, item) => {
      captured = item;
      return Promise.resolve(itemRow());
    });
    await service.capture(db, {
      type: "note",
      title: "My Title",
      content: "body",
      source: "quick_add",
    });
    expect((captured as { title: string }).title).toBe("My Title");
  });
});

describe("lifecycle", () => {
  it("archive transitions the row", async () => {
    h.getById.mockResolvedValue(itemRow());
    h.update.mockImplementation((_db, _id, item) =>
      Promise.resolve(itemRow({ status: item.status })),
    );
    const result = await service.archive(db, "i1");
    expect(result.status).toBe("archived");
  });

  it("delete transitions to deleted", async () => {
    h.getById.mockResolvedValue(itemRow());
    h.update.mockImplementation((_db, _id, item) =>
      Promise.resolve(itemRow({ status: item.status })),
    );
    const result = await service.remove(db, "i1");
    expect(result.status).toBe("deleted");
  });

  it("restore returns an item to new", async () => {
    h.getById.mockResolvedValue(itemRow({ status: "archived", archivedAt: new Date() }));
    h.update.mockImplementation((_db, _id, item) =>
      Promise.resolve(itemRow({ status: item.status, archivedAt: item.archivedAt })),
    );
    const result = await service.restore(db, "i1");
    expect(result.status).toBe("new");
  });

  it("organize records the destination", async () => {
    h.getById.mockResolvedValue(itemRow());
    let captured: { metadata: Record<string, unknown> } | undefined;
    h.update.mockImplementation((_db, _id, item) => {
      captured = item;
      return Promise.resolve(itemRow({ status: item.status, metadata: item.metadata }));
    });
    const result = await service.organize(db, "i1", "Projects");
    expect(result.status).toBe("organized");
    expect(captured?.metadata["destination"]).toBe("Projects");
  });

  it("throws when the item is missing", async () => {
    h.getById.mockResolvedValue(undefined);
    await expect(service.archive(db, "missing")).rejects.toThrow("Inbox item not found");
  });
});

describe("search + suggest + countNew", () => {
  it("searches in memory over non-deleted items", async () => {
    h.listSearchable.mockResolvedValue([
      itemRow({ id: "1", title: "Buy milk" }),
      itemRow({ id: "2", title: "Read book", content: "pragmatic" }),
    ]);
    const result = await service.search(db, { text: "milk" });
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("suggests destinations for an item", async () => {
    h.getById.mockResolvedValue(itemRow({ type: "task", content: "call the dentist" }));
    const suggestions = await service.suggest(db, "i1");
    expect(suggestions[0]?.destination).toBe("Planner");
  });

  it("countNew delegates to the repository", async () => {
    h.countByStatus.mockResolvedValue(7);
    expect(await service.countNew(db)).toBe(7);
    expect(h.countByStatus).toHaveBeenCalledWith(db, "new");
  });
});
