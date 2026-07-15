import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlannerBlockRow, PlannerDayRow } from "@myos/db/schema";
import type { Task } from "@myos/core/task";

// PlannerService is server-only; mock the DB boundary (repository + reused
// task/today services) and verify the engine wiring + persistence rules.
const h = vi.hoisted(() => ({
  getDay: vi.fn(),
  upsertDay: vi.fn(),
  listBlocks: vi.fn(),
  getBlock: vi.fn(),
  insertBlock: vi.fn(),
  updateBlock: vi.fn(),
  deleteGenerated: vi.fn(),
  deleteAllBlocks: vi.fn(),
  addHistory: vi.fn(),
  listHistory: vi.fn(),
  getState: vi.fn(),
  listTasks: vi.fn(),
  calendarMeetings: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("../today/service", () => ({ getState: h.getState }));
vi.mock("../task/service", () => ({ list: h.listTasks }));
vi.mock("../calendar/service", () => ({ meetings: h.calendarMeetings }));

import * as service from "./service";
import { blockRowToBlock, dayRowToDay, blockToColumns } from "./mapper";

const db = {} as never;
const TZ = "Asia/Kolkata";
const PREFS = { preferredStartOfDay: "09:00", preferredEndOfDay: "18:00" };
const DATE = "2026-07-07";

function task(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Task",
    description: "",
    status: "not_started",
    priority: "medium",
    estimatedMinutes: 60,
    actualMinutes: null,
    dueAt: null,
    scheduledStart: null,
    scheduledEnd: null,
    completedAt: null,
    parentTaskId: null,
    projectId: null,
    milestoneId: null,
    objectiveId: null,
    createdAt: "2026-07-07T06:00:00.000Z",
    updatedAt: "2026-07-07T06:00:00.000Z",
    labels: [],
    dependencies: [],
    ...over,
  };
}

function blockRow(over: Partial<PlannerBlockRow> = {}): PlannerBlockRow {
  return {
    id: "b1",
    plannerDate: DATE,
    taskId: null,
    type: "task",
    title: "Block",
    startTime: new Date(`${DATE}T09:00:00`),
    endTime: new Date(`${DATE}T10:00:00`),
    locked: false,
    generated: true,
    completed: false,
    createdAt: new Date(`${DATE}T06:00:00`),
    ...over,
  };
}

function dayRow(over: Partial<PlannerDayRow> = {}): PlannerDayRow {
  return {
    date: DATE,
    generatedAt: new Date(`${DATE}T06:00:00`),
    workingStart: "09:00",
    workingEnd: "18:00",
    focusWindowStart: "09:00",
    focusWindowEnd: "12:00",
    status: "generated",
    locked: false,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getState.mockResolvedValue(null);
  h.listTasks.mockResolvedValue([]);
  h.listBlocks.mockResolvedValue([]);
  h.getDay.mockResolvedValue(undefined);
  h.calendarMeetings.mockResolvedValue([]);
  h.upsertDay.mockResolvedValue(dayRow());
  h.insertBlock.mockImplementation((_db, b) =>
    Promise.resolve(blockRow(blockToColumns(b) as never)),
  );
});

describe("mapper", () => {
  it("derives block source from task id / generated", () => {
    expect(blockRowToBlock(blockRow({ taskId: "x" })).source).toBe("task");
    expect(blockRowToBlock(blockRow({ taskId: null, generated: false })).source).toBe("manual");
    expect(blockRowToBlock(blockRow({ taskId: null, generated: true })).source).toBe("generated");
  });
  it("maps a day row to a DTO", () => {
    const d = dayRowToDay(dayRow());
    expect(d.status).toBe("generated");
    expect(d.workingStart).toBe("09:00");
  });
  it("blockToColumns produces Date timestamps", () => {
    const cols = blockToColumns(blockRowToBlock(blockRow()));
    expect(cols.startTime).toBeInstanceOf(Date);
    expect(cols.title).toBe("Block");
  });
  it("maps a null generatedAt to null", () => {
    expect(dayRowToDay(dayRow({ generatedAt: null })).generatedAt).toBeNull();
  });
});

describe("generate", () => {
  beforeEach(() => {
    h.listTasks.mockResolvedValue([task({ id: "a" }), task({ id: "b" })]);
  });

  it("upserts the day, deletes generated blocks and inserts new ones", async () => {
    await service.generate(db, TZ, PREFS, DATE);
    expect(h.upsertDay).toHaveBeenCalled();
    expect(h.deleteGenerated).toHaveBeenCalledWith(db, DATE);
    expect(h.insertBlock).toHaveBeenCalled();
    expect(h.addHistory).toHaveBeenCalledWith(db, DATE, "generate", expect.any(Object));
  });

  it("returns the persisted plan with conflicts", async () => {
    h.listBlocks
      .mockResolvedValueOnce([]) // fixedBlocks lookup
      .mockResolvedValue([blockRow({ id: "gen", taskId: "a" })]); // readPlan
    const plan = await service.generate(db, TZ, PREFS, DATE);
    expect(plan).toHaveProperty("day");
    expect(plan).toHaveProperty("blocks");
    expect(plan).toHaveProperty("conflicts");
  });

  it("only inserts generated, non-locked blocks", async () => {
    await service.generate(db, TZ, PREFS, DATE);
    for (const call of h.insertBlock.mock.calls) {
      const block = call[1];
      expect(block.generated && !block.locked).toBe(true);
    }
  });

  it("carries locked + manual blocks in as fixed (preserved)", async () => {
    const locked = blockRow({
      id: "L",
      taskId: "design",
      locked: true,
      startTime: new Date(`${DATE}T15:00:00`),
      endTime: new Date(`${DATE}T16:00:00`),
    });
    h.listBlocks.mockResolvedValue([locked]);
    h.listTasks.mockResolvedValue([task({ id: "design" }), task({ id: "impl" })]);
    await service.generate(db, TZ, PREFS, DATE);
    // design is pinned by the locked block → not re-inserted as a generated block
    const insertedTaskIds = h.insertBlock.mock.calls.map((c) => c[1].taskId);
    expect(insertedTaskIds).not.toContain("design");
  });

  it("seeds a lunch break even with no tasks", async () => {
    h.listTasks.mockResolvedValue([]);
    await service.generate(db, TZ, PREFS, DATE);
    const titles = h.insertBlock.mock.calls.map((c) => c[1].title);
    expect(titles).toContain("Lunch");
  });

  it("stamps generatedAt on the day", async () => {
    await service.generate(db, TZ, PREFS, DATE);
    const day = h.upsertDay.mock.calls[0]![1];
    expect(day.generatedAt).not.toBeNull();
    expect(day.status).toBe("generated");
  });

  it("defaults the date to today when none is given", async () => {
    await service.generate(db, TZ, PREFS);
    expect(h.upsertDay).toHaveBeenCalled();
  });
});

describe("get", () => {
  it("returns an empty day when none is stored", async () => {
    const plan = await service.get(db, TZ, PREFS, DATE);
    expect(plan.day.status).toBe("empty");
    expect(plan.blocks).toEqual([]);
  });

  it("maps stored blocks", async () => {
    h.getDay.mockResolvedValue(dayRow());
    h.listBlocks.mockResolvedValue([blockRow({ id: "x", taskId: "a" })]);
    const plan = await service.get(db, TZ, PREFS, DATE);
    expect(plan.blocks[0]?.id).toBe("x");
  });
});

describe("block operations", () => {
  it("lock sets the flag", async () => {
    h.getBlock.mockResolvedValue(blockRow());
    h.updateBlock.mockImplementation((_db, _id, b) =>
      Promise.resolve(blockRow({ locked: b.locked })),
    );
    expect((await service.lock(db, "b1")).locked).toBe(true);
  });

  it("unlock clears the flag", async () => {
    h.getBlock.mockResolvedValue(blockRow({ locked: true }));
    h.updateBlock.mockImplementation((_db, _id, b) =>
      Promise.resolve(blockRow({ locked: b.locked })),
    );
    expect((await service.unlock(db, "b1")).locked).toBe(false);
  });

  it("move shifts the block times", async () => {
    h.getBlock.mockResolvedValue(blockRow());
    let captured: { startTime: Date } | undefined;
    h.updateBlock.mockImplementation((_db, _id, b) => {
      captured = { startTime: new Date(b.startTime) };
      return Promise.resolve(
        blockRow({ startTime: new Date(b.startTime), endTime: new Date(b.endTime) }),
      );
    });
    await service.move(db, "b1", "later", 30);
    expect(captured?.startTime.getMinutes()).toBe(30);
  });

  it("move earlier shifts the block backwards", async () => {
    h.getBlock.mockResolvedValue(
      blockRow({ startTime: new Date(`${DATE}T10:00:00`), endTime: new Date(`${DATE}T11:00:00`) }),
    );
    let captured: Date | undefined;
    h.updateBlock.mockImplementation((_db, _id, b) => {
      captured = new Date(b.startTime);
      return Promise.resolve(
        blockRow({ startTime: new Date(b.startTime), endTime: new Date(b.endTime) }),
      );
    });
    await service.move(db, "b1", "earlier", 60);
    expect(captured?.getHours()).toBe(9);
  });

  it("throws when the block is missing", async () => {
    h.getBlock.mockResolvedValue(undefined);
    await expect(service.lock(db, "x")).rejects.toThrow("Block not found");
  });
});

describe("optimize", () => {
  it("re-persists optimized blocks and marks the day optimized", async () => {
    h.listBlocks.mockResolvedValue([
      blockRow({
        id: "t",
        type: "task",
        startTime: new Date(`${DATE}T10:00:00`),
        endTime: new Date(`${DATE}T11:00:00`),
      }),
    ]);
    h.getDay.mockResolvedValue(dayRow());
    await service.optimize(db, TZ, PREFS, DATE);
    expect(h.deleteGenerated).toHaveBeenCalled();
    expect(h.upsertDay).toHaveBeenCalledWith(db, expect.objectContaining({ status: "optimized" }));
  });
});

describe("clear", () => {
  it("deletes all blocks and resets the day", async () => {
    await service.clear(db, TZ, PREFS, DATE);
    expect(h.deleteAllBlocks).toHaveBeenCalledWith(db, DATE);
    expect(h.upsertDay).toHaveBeenCalledWith(db, expect.objectContaining({ status: "empty" }));
  });
});

describe("conflicts + explain + history + summary", () => {
  it("computes conflicts from stored blocks", async () => {
    h.listBlocks.mockResolvedValue([
      blockRow({
        id: "a",
        startTime: new Date(`${DATE}T09:00:00`),
        endTime: new Date(`${DATE}T10:30:00`),
      }),
      blockRow({
        id: "b",
        startTime: new Date(`${DATE}T10:00:00`),
        endTime: new Date(`${DATE}T11:00:00`),
      }),
    ]);
    const conflicts = await service.conflicts(db, TZ, PREFS, DATE);
    expect(conflicts.some((c) => c.type === "overlap")).toBe(true);
  });

  it("explains a block deterministically", async () => {
    h.getBlock.mockResolvedValue(blockRow({ id: "x", taskId: "a", type: "task" }));
    h.listTasks.mockResolvedValue([task({ id: "a", priority: "high" })]);
    const ex = await service.explain(db, TZ, PREFS, "x");
    expect(ex.reasons).toContain("High priority");
  });

  it("throws when explaining a missing block", async () => {
    h.getBlock.mockResolvedValue(undefined);
    await expect(service.explain(db, TZ, PREFS, "x")).rejects.toThrow("Block not found");
  });

  it("lists history entries", async () => {
    h.listHistory.mockResolvedValue([
      {
        id: "h1",
        plannerDate: DATE,
        action: "generate",
        metadata: {},
        createdAt: new Date(`${DATE}T06:00:00`),
      },
    ]);
    const rows = await service.history(db, TZ, DATE, 50);
    expect(rows[0]?.action).toBe("generate");
  });

  it("history defaults to today when no date is provided", async () => {
    h.listHistory.mockResolvedValue([]);
    await service.history(db, TZ, undefined, 50);
    expect(h.listHistory).toHaveBeenCalled();
    expect(typeof h.listHistory.mock.calls[0]![1]).toBe("string");
  });

  it("summarizes utilization for the status bar", async () => {
    h.getDay.mockResolvedValue(dayRow());
    h.listBlocks.mockResolvedValue([
      blockRow({
        id: "a",
        startTime: new Date(`${DATE}T09:00:00`),
        endTime: new Date(`${DATE}T10:00:00`),
      }),
    ]);
    const s = await service.summary(db, TZ, PREFS, DATE);
    expect(s.utilization.scheduledMinutes).toBe(60);
    expect(s.day.status).toBe("generated");
  });

  it("reports no overlap conflicts for a single clean block", async () => {
    h.listBlocks.mockResolvedValue([
      blockRow({
        id: "a",
        taskId: "a",
        startTime: new Date(`${DATE}T09:00:00`),
        endTime: new Date(`${DATE}T10:00:00`),
      }),
    ]);
    h.listTasks.mockResolvedValue([task({ id: "a", estimatedMinutes: 0 })]);
    const conflicts = await service.conflicts(db, TZ, PREFS, DATE);
    expect(conflicts.some((c) => c.type === "overlap")).toBe(false);
    expect(conflicts.some((c) => c.type === "dependency-violation")).toBe(false);
  });

  it("summary counts conflicts", async () => {
    h.getDay.mockResolvedValue(dayRow());
    h.listBlocks.mockResolvedValue([
      blockRow({
        id: "a",
        startTime: new Date(`${DATE}T09:00:00`),
        endTime: new Date(`${DATE}T10:30:00`),
      }),
      blockRow({
        id: "b",
        startTime: new Date(`${DATE}T10:00:00`),
        endTime: new Date(`${DATE}T11:00:00`),
      }),
    ]);
    const s = await service.summary(db, TZ, PREFS, DATE);
    expect(s.conflicts).toBeGreaterThan(0);
  });
});
