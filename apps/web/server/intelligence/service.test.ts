import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  getPreferences: vi.fn(),
  savePreferences: vi.fn(),
  listCollections: vi.fn(),
  insertCollection: vi.fn(),
  updateCollectionRow: vi.fn(),
  deleteCollection: vi.fn(),
  insertSnapshot: vi.fn(),
  listSnapshots: vi.fn(),
  insertReport: vi.fn(),
  listReports: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("./composer", () => ({ composeInput: vi.fn() }));

import { composeInput } from "./composer";
import {
  addToCollection,
  createCollection,
  preferences,
  removeFromCollection,
  savePreferences,
} from "./service";
import { generatePeriodReport, generateReview } from "./reviews";
import { makeCollection, makeInput } from "@myos/core/intelligence";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.insertCollection.mockImplementation((_db, c) => Promise.resolve(c));
  h.updateCollectionRow.mockImplementation((_db, id, patch) =>
    Promise.resolve({ ...makeCollection({ id }), ...patch }),
  );
  h.savePreferences.mockImplementation((_db, p) => Promise.resolve(p));
  h.insertSnapshot.mockImplementation((_db, s) => Promise.resolve(s));
  h.insertReport.mockImplementation((_db, r) => Promise.resolve(r));
  h.listSnapshots.mockResolvedValue([]);
  (composeInput as ReturnType<typeof vi.fn>).mockResolvedValue(makeInput());
});

describe("preferences — config only, seeded + reconciled", () => {
  it("seeds a default when none is stored", async () => {
    h.getPreferences.mockResolvedValue(null);
    await preferences(db);
    expect(h.savePreferences).toHaveBeenCalled();
    const saved = h.savePreferences.mock.calls[0]?.[1];
    expect(saved.widgetOrder.length).toBeGreaterThan(0);
  });

  it("reconciles a stored layout against the widget set", async () => {
    h.getPreferences.mockResolvedValue({
      widgetOrder: ["health", "bogus"],
      hiddenWidgets: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const prefs = await preferences(db);
    expect(prefs.widgetOrder[0]).toBe("health");
    expect(prefs.widgetOrder).not.toContain("bogus");
  });

  it("saves an explicit layout", async () => {
    await savePreferences(db, { widgetOrder: ["today", "health"] });
    expect(h.savePreferences).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ widgetOrder: ["today", "health"] }),
    );
  });
});

describe("collections — references, never copies", () => {
  it("creates a collection through the engine", async () => {
    await createCollection(db, { name: "  Semester  " });
    expect(h.insertCollection).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ name: "Semester" }),
    );
  });

  it("adds a ref via the pure core, ignoring duplicates", async () => {
    h.listCollections.mockResolvedValue([makeCollection({ id: "col-1", entityRefs: [] })]);
    await addToCollection(db, "col-1", { module: "goal", id: "g1" });
    const patch = h.updateCollectionRow.mock.calls[0]?.[2];
    expect(patch.entityRefs).toEqual([{ module: "goal", id: "g1" }]);
  });

  it("removes a ref", async () => {
    h.listCollections.mockResolvedValue([
      makeCollection({ id: "col-1", entityRefs: [{ module: "goal", id: "g1" }] }),
    ]);
    await removeFromCollection(db, "col-1", { module: "goal", id: "g1" });
    const patch = h.updateCollectionRow.mock.calls[0]?.[2];
    expect(patch.entityRefs).toEqual([]);
  });

  it("returns null for an unknown collection", async () => {
    h.listCollections.mockResolvedValue([]);
    expect(await addToCollection(db, "gone", { module: "goal", id: "g1" })).toBeNull();
  });
});

describe("reviews — immutable snapshots, reports from read models", () => {
  it("builds and stores a review snapshot", async () => {
    const snap = await generateReview(db, "UTC", "weekly", "2026-07-13");
    expect(snap.period).toBe("weekly");
    expect(h.insertSnapshot).toHaveBeenCalled();
    expect(snap.areas).toHaveLength(8);
  });

  it("generates a report, building a snapshot first when none exists", async () => {
    h.listSnapshots.mockResolvedValue([]);
    const report = await generatePeriodReport(db, "UTC", "monthly", "markdown");
    expect(report.content).toContain("# Monthly Review");
    expect(h.insertReport).toHaveBeenCalled();
  });

  it("reuses an existing snapshot for the report when present", async () => {
    const existing = await generateReview(db, "UTC", "weekly", "2026-07-13");
    h.listSnapshots.mockResolvedValue([existing]);
    h.insertSnapshot.mockClear();
    await generatePeriodReport(db, "UTC", "weekly", "json");
    // no NEW snapshot written — the existing one is reused.
    expect(h.insertSnapshot).not.toHaveBeenCalled();
  });
});
