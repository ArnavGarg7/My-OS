import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TimelineEventRow, TimelineMemoryRow } from "@myos/db/schema";

// TimelineService is server-only; mock the repository boundary and verify the
// engine wiring — record importance derivation, feed/day/search, memories.
const h = vi.hoisted(() => ({
  insertEvent: vi.fn(),
  getEvent: vi.fn(),
  listEvents: vi.fn(),
  allEvents: vi.fn(),
  eventsByIds: vi.fn(),
  listMemories: vi.fn(),
  getMemoryByEvent: vi.fn(),
  insertMemory: vi.fn(),
  deleteMemory: vi.fn(),
  listSnapshots: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";
import * as memories from "./memories";
import * as highlights from "./highlights";

const db = {} as never;
const D = (s: string) => new Date(s);

function eventRow(over: Partial<TimelineEventRow> = {}): TimelineEventRow {
  return {
    id: "e1",
    eventType: "goal.completed",
    sourceModule: "goal",
    entityId: "g1",
    title: "Shipped v1",
    summary: "Shipped v1",
    timestamp: D("2026-07-03T09:00:00Z"),
    importance: 100,
    metadata: {},
    createdAt: D("2026-07-03T09:00:00Z"),
    ...over,
  };
}

function memoryRow(over: Partial<TimelineMemoryRow> = {}): TimelineMemoryRow {
  return {
    id: "m1",
    eventId: "e1",
    memoryType: "achievement",
    title: "Shipped v1",
    description: "Shipped v1",
    pinned: true,
    createdAt: D("2026-07-03T09:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("record", () => {
  it("derives importance from the event type and persists", async () => {
    h.insertEvent.mockImplementation((_db, values) =>
      Promise.resolve(eventRow({ ...values, id: "new" })),
    );
    const out = await service.record(db, {
      eventType: "goal.completed",
      source: "goal",
      title: "Won",
    });
    expect(out.importance).toBe(100);
    const values = h.insertEvent.mock.calls[0]![1];
    expect(values.importance).toBe(100);
    expect(values.sourceModule).toBe("goal");
    expect(values.summary).toBe("Won");
  });

  it("honours an explicit importance override", async () => {
    h.insertEvent.mockImplementation((_db, values) => Promise.resolve(eventRow(values)));
    await service.record(db, {
      eventType: "task.created",
      source: "task",
      title: "x",
      importance: 77,
    });
    expect(h.insertEvent.mock.calls[0]![1].importance).toBe(77);
  });

  it("preserves entity id + metadata + supplied timestamp", async () => {
    h.insertEvent.mockImplementation((_db, values) => Promise.resolve(eventRow(values)));
    await service.record(db, {
      eventType: "health.logged",
      source: "health",
      title: "Ran",
      entityId: "h9",
      metadata: { intensity: 8 },
      timestamp: "2026-07-01T06:00:00.000Z",
    });
    const values = h.insertEvent.mock.calls[0]![1];
    expect(values.entityId).toBe("h9");
    expect(values.metadata).toEqual({ intensity: 8 });
    expect(values.timestamp).toEqual(new Date("2026-07-01T06:00:00.000Z"));
  });

  it("defaults importance to 40 for unknown types", async () => {
    h.insertEvent.mockImplementation((_db, values) => Promise.resolve(eventRow(values)));
    await service.record(db, { eventType: "custom.thing", source: "ai", title: "x" });
    expect(h.insertEvent.mock.calls[0]![1].importance).toBe(40);
  });
});

describe("feed", () => {
  it("returns filtered events + groups", async () => {
    h.listEvents.mockResolvedValue([
      eventRow({ id: "a", timestamp: D("2026-07-03T09:00:00Z") }),
      eventRow({
        id: "b",
        eventType: "task.completed",
        sourceModule: "task",
        timestamp: D("2026-07-02T09:00:00Z"),
      }),
    ]);
    const out = await service.feed(db, { grouping: "day" });
    expect(out.events).toHaveLength(2);
    expect(out.groups).toHaveLength(2);
    expect(out.grouping).toBe("day");
  });

  it("applies a source filter", async () => {
    h.listEvents.mockResolvedValue([
      eventRow({ id: "a" }),
      eventRow({ id: "b", sourceModule: "task", eventType: "task.completed" }),
    ]);
    const out = await service.feed(db, { sources: ["goal"] });
    expect(out.events.map((e) => e.id)).toEqual(["a"]);
  });

  it("applies an importance floor", async () => {
    h.listEvents.mockResolvedValue([
      eventRow({ id: "a", importance: 100 }),
      eventRow({ id: "b", importance: 20, eventType: "task.created" }),
    ]);
    const out = await service.feed(db, { minImportance: 85 });
    expect(out.events.map((e) => e.id)).toEqual(["a"]);
  });

  it("passes date bounds to the repository", async () => {
    h.listEvents.mockResolvedValue([]);
    await service.feed(db, { from: "2026-07-01", to: "2026-07-31", limit: 10 });
    const opts = h.listEvents.mock.calls[0]![1];
    expect(opts.limit).toBe(10);
    expect(opts.from).toBeInstanceOf(Date);
    expect(opts.to).toBeInstanceOf(Date);
  });

  it("defaults to day grouping", async () => {
    h.listEvents.mockResolvedValue([eventRow({ id: "a" })]);
    expect((await service.feed(db, {})).grouping).toBe("day");
  });
});

describe("day", () => {
  it("aggregates a single day", async () => {
    h.listEvents.mockResolvedValue([eventRow({ id: "a" })]);
    const out = await service.day(db, "2026-07-03");
    expect(out.day.eventCount).toBe(1);
    expect(out.events).toHaveLength(1);
  });
});

describe("search", () => {
  it("keyword-matches over stored events", async () => {
    h.allEvents.mockResolvedValue([
      eventRow({ id: "a", title: "Shipped v1" }),
      eventRow({
        id: "b",
        title: "Groceries",
        eventType: "finance.transaction",
        sourceModule: "finance",
      }),
    ]);
    const out = await service.search(db, "groceries");
    expect(out.map((e) => e.id)).toEqual(["b"]);
  });

  it("returns all events for a blank query", async () => {
    h.allEvents.mockResolvedValue([eventRow({ id: "a" }), eventRow({ id: "b" })]);
    expect(await service.search(db, "  ")).toHaveLength(2);
  });
});

describe("day (empty)", () => {
  it("returns a zeroed aggregate for a quiet day", async () => {
    h.listEvents.mockResolvedValue([]);
    const out = await service.day(db, "2020-01-01");
    expect(out.day.eventCount).toBe(0);
    expect(out.events).toHaveLength(0);
  });
});

describe("statistics + counts", () => {
  it("computes statistics", async () => {
    h.allEvents.mockResolvedValue([eventRow({ id: "a" }), eventRow({ id: "b" })]);
    const stats = await service.statistics(db);
    expect(stats.totalEvents).toBe(2);
  });

  it("counts today + latest", async () => {
    h.listEvents
      .mockResolvedValueOnce([eventRow({ id: "a" }), eventRow({ id: "b" })]) // day window
      .mockResolvedValueOnce([eventRow({ id: "a" })]); // latest
    const c = await service.counts(db, "2026-07-03");
    expect(c.todayCount).toBe(2);
    expect(c.latestAt).toBe("2026-07-03T09:00:00.000Z");
  });

  it("reports zero counts with a null latest when empty", async () => {
    h.listEvents.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const c = await service.counts(db, "2026-07-03");
    expect(c.todayCount).toBe(0);
    expect(c.latestAt).toBeNull();
  });

  it("computes empty statistics without events", async () => {
    h.allEvents.mockResolvedValue([]);
    const stats = await service.statistics(db);
    expect(stats.totalEvents).toBe(0);
    expect(stats.busiestDay).toBeNull();
  });
});

describe("memories", () => {
  it("lists memories joined to their events", async () => {
    h.listMemories.mockResolvedValue([memoryRow()]);
    h.eventsByIds.mockResolvedValue([eventRow()]);
    const out = await memories.list(db);
    expect(out).toHaveLength(1);
    expect(out[0]!.memoryType).toBe("achievement");
    expect(out[0]!.at).toBe("2026-07-03T09:00:00.000Z");
  });

  it("pins an event deriving its memory type", async () => {
    h.getEvent.mockResolvedValue(eventRow());
    h.getMemoryByEvent.mockResolvedValue(undefined);
    h.insertMemory.mockImplementation((_db, values) =>
      Promise.resolve(memoryRow({ ...values, id: "new" })),
    );
    const out = await memories.pin(db, "e1");
    expect(out.memoryType).toBe("achievement");
    expect(h.insertMemory.mock.calls[0]![1].memoryType).toBe("achievement");
  });

  it("is idempotent when already pinned", async () => {
    h.getEvent.mockResolvedValue(eventRow());
    h.getMemoryByEvent.mockResolvedValue(memoryRow());
    const out = await memories.pin(db, "e1");
    expect(out.id).toBe("m1");
    expect(h.insertMemory).not.toHaveBeenCalled();
  });

  it("rejects pinning a missing event", async () => {
    h.getEvent.mockResolvedValue(undefined);
    await expect(memories.pin(db, "nope")).rejects.toThrow("Event not found");
  });

  it("unpins by id", async () => {
    h.deleteMemory.mockResolvedValue(undefined);
    expect(await memories.unpin(db, "m1")).toEqual({ ok: true });
    expect(h.deleteMemory).toHaveBeenCalledWith(db, "m1");
  });
});

describe("highlights + snapshots", () => {
  it("computes highlights from stored events", async () => {
    h.allEvents.mockResolvedValue([
      eventRow({ id: "a", metadata: { focusMinutes: 60 } }),
      eventRow({ id: "b", eventType: "task.completed", sourceModule: "task" }),
    ]);
    const out = await highlights.highlights(db, {});
    expect(out.length).toBeGreaterThan(0);
    expect(out.some((hl) => hl.category === "biggest_achievement")).toBe(true);
  });

  it("builds a snapshot", async () => {
    h.allEvents.mockResolvedValue([eventRow({ id: "a" })]);
    const snap = await highlights.snapshot(db, "month", "2026-07-15");
    expect(snap.snapshotType).toBe("month");
    expect(snap.metadata.eventCount).toBe(1);
  });

  it("builds all four snapshots", async () => {
    h.allEvents.mockResolvedValue([eventRow({ id: "a" })]);
    const snaps = await highlights.snapshots(db, "2026-07-15");
    expect(snaps).toHaveLength(4);
  });
});
