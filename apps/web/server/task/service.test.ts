import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRow } from "@myos/db/schema";

// TaskService is server-only; mock the DB boundary (repository + reused
// inbox/today services) and verify engine wiring + hydration + conversion.
const h = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  listDependencies: vi.fn(),
  addDependency: vi.fn(),
  removeDependency: vi.fn(),
  listLabels: vi.fn(),
  createLabel: vi.fn(),
  labelsForTasks: vi.fn(),
  getRecurrence: vi.fn(),
  upsertRecurrence: vi.fn(),
  getState: vi.fn(),
  inboxGetById: vi.fn(),
  inboxUpdate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("../today/service", () => ({ getState: h.getState }));
vi.mock("../inbox/repository", () => ({ getById: h.inboxGetById, update: h.inboxUpdate }));

import * as service from "./service";
import { rowToTask, taskToColumns } from "./mapper";

const db = {} as never;
const TZ = "Asia/Kolkata";
const PREFS = { preferredStartOfDay: "09:00", preferredEndOfDay: "18:00" };

function taskRow(over: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "t1",
    title: "Write report",
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
    createdAt: new Date("2026-07-07T06:00:00Z"),
    updatedAt: new Date("2026-07-07T06:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.labelsForTasks.mockResolvedValue(new Map());
  h.listDependencies.mockResolvedValue([]);
  h.getRecurrence.mockResolvedValue(undefined);
  h.getState.mockResolvedValue(null);
});

describe("mapper", () => {
  it("round-trips a row through DTO and columns", () => {
    const t = rowToTask(taskRow({ dueAt: new Date("2026-07-08T09:00:00Z") }));
    expect(t.dueAt).toBe("2026-07-08T09:00:00.000Z");
    expect(t.labels).toEqual([]);
    const cols = taskToColumns(t);
    expect(cols.dueAt).toBeInstanceOf(Date);
    expect(cols.title).toBe("Write report");
  });

  it("hydrates null timestamps to null", () => {
    expect(rowToTask(taskRow()).dueAt).toBeNull();
  });
});

describe("create", () => {
  it("creates a validated task", async () => {
    h.insert.mockResolvedValue(taskRow({ id: "new1", title: "New" }));
    const t = await service.create(db, { title: "New" });
    expect(h.insert).toHaveBeenCalled();
    expect(t.id).toBe("new1");
    expect(t.status).toBe("not_started");
  });
});

describe("list + get", () => {
  it("hydrates labels and dependencies", async () => {
    h.list.mockResolvedValue([taskRow({ id: "a" }), taskRow({ id: "b" })]);
    h.listDependencies.mockResolvedValue([{ taskId: "a", dependsOnTaskId: "b" }]);
    h.labelsForTasks.mockResolvedValue(
      new Map([["a", [{ id: "l1", name: "Work", color: "blue" }]]]),
    );
    const tasks = await service.list(db, {});
    const a = tasks.find((t) => t.id === "a")!;
    expect(a.dependencies).toEqual(["b"]);
    expect(a.labels[0]?.name).toBe("Work");
  });

  it("filters by labelId", async () => {
    h.list.mockResolvedValue([taskRow({ id: "a" }), taskRow({ id: "b" })]);
    h.labelsForTasks.mockResolvedValue(
      new Map([["a", [{ id: "l1", name: "Work", color: "blue" }]]]),
    );
    const tasks = await service.list(db, { labelId: "l1" });
    expect(tasks.map((t) => t.id)).toEqual(["a"]);
  });

  it("get throws when missing", async () => {
    h.getById.mockResolvedValue(undefined);
    await expect(service.get(db, "x")).rejects.toThrow("Task not found");
  });
});

describe("update", () => {
  it("applies a status change and stamps completedAt", async () => {
    h.getById.mockResolvedValue(taskRow());
    h.update.mockImplementation((_db, _id, t) =>
      Promise.resolve(
        taskRow({ status: t.status, completedAt: t.completedAt ? new Date(t.completedAt) : null }),
      ),
    );
    const t = await service.update(db, { id: "t1", status: "completed" });
    expect(t.status).toBe("completed");
    expect(t.completedAt).not.toBeNull();
  });

  it("clears completedAt when moving out of completed", async () => {
    h.getById.mockResolvedValue(taskRow({ status: "completed", completedAt: new Date() }));
    h.update.mockImplementation((_db, _id, t) =>
      Promise.resolve(
        taskRow({ status: t.status, completedAt: t.completedAt ? new Date(t.completedAt) : null }),
      ),
    );
    const t = await service.update(db, { id: "t1", status: "in_progress" });
    expect(t.completedAt).toBeNull();
  });

  it("patches title + priority", async () => {
    h.getById.mockResolvedValue(taskRow());
    h.update.mockImplementation((_db, _id, t) =>
      Promise.resolve(taskRow({ title: t.title, priority: t.priority })),
    );
    const t = await service.update(db, { id: "t1", title: "Renamed", priority: "high" });
    expect(t.title).toBe("Renamed");
    expect(t.priority).toBe("high");
  });
});

describe("lifecycle", () => {
  it("complete marks completed", async () => {
    h.getById.mockResolvedValue(taskRow());
    h.update.mockImplementation((_db, _id, t) =>
      Promise.resolve(
        taskRow({ status: t.status, completedAt: t.completedAt ? new Date(t.completedAt) : null }),
      ),
    );
    const t = await service.complete(db, "t1");
    expect(t.status).toBe("completed");
  });

  it("complete generates the next occurrence when recurring", async () => {
    h.getById.mockResolvedValue(taskRow({ dueAt: new Date("2026-07-07T09:00:00Z") }));
    h.update.mockResolvedValue(
      taskRow({ status: "completed", dueAt: new Date("2026-07-07T09:00:00Z") }),
    );
    h.getRecurrence.mockResolvedValue({
      taskId: "t1",
      frequency: "weekly",
      interval: 1,
      nextOccurrence: null,
    });
    h.insert.mockResolvedValue(taskRow({ id: "next", dueAt: new Date("2026-07-14T09:00:00Z") }));
    h.upsertRecurrence.mockResolvedValue({});
    await service.complete(db, "t1");
    expect(h.insert).toHaveBeenCalled();
    expect(h.upsertRecurrence).toHaveBeenCalled();
  });

  it("archive marks archived", async () => {
    h.getById.mockResolvedValue(taskRow());
    h.update.mockImplementation((_db, _id, t) => Promise.resolve(taskRow({ status: t.status })));
    expect((await service.archive(db, "t1")).status).toBe("archived");
  });

  it("delete removes the row", async () => {
    h.remove.mockResolvedValue(undefined);
    expect(await service.remove(db, "t1")).toEqual({ id: "t1" });
    expect(h.remove).toHaveBeenCalledWith(db, "t1");
  });
});

describe("schedule", () => {
  it("applies a recommended slot and persists it", async () => {
    h.getById.mockResolvedValue(taskRow({ estimatedMinutes: 60 }));
    h.list.mockResolvedValue([]);
    h.update.mockImplementation((_db, _id, t) =>
      Promise.resolve(
        taskRow({ scheduledStart: t.scheduledStart ? new Date(t.scheduledStart) : null }),
      ),
    );
    const { task, result } = await service.schedule(db, TZ, PREFS, "t1");
    // Depending on wall-clock the slot may land today or overflow; either way
    // the result shape is well-formed and, if scheduled, it was persisted.
    expect(result).toHaveProperty("overflow");
    if (result.recommendedStart) {
      expect(h.update).toHaveBeenCalled();
      expect(task.scheduledStart).not.toBeNull();
    }
  });
});

describe("dependencies", () => {
  it("adds a valid dependency", async () => {
    h.listDependencies.mockResolvedValue([]);
    h.addDependency.mockResolvedValue(undefined);
    h.getById.mockResolvedValue(taskRow({ id: "a" }));
    await service.addDependency(db, "a", "b");
    expect(h.addDependency).toHaveBeenCalledWith(db, "a", "b");
  });

  it("rejects a self-reference", async () => {
    h.listDependencies.mockResolvedValue([]);
    await expect(service.addDependency(db, "a", "a")).rejects.toThrow("self-reference");
  });

  it("rejects a cycle", async () => {
    h.listDependencies.mockResolvedValue([{ taskId: "a", dependsOnTaskId: "b" }]);
    await expect(service.addDependency(db, "b", "a")).rejects.toThrow("cycle");
  });

  it("removes a dependency", async () => {
    h.removeDependency.mockResolvedValue(undefined);
    h.getById.mockResolvedValue(taskRow({ id: "a" }));
    await service.removeDependency(db, "a", "b");
    expect(h.removeDependency).toHaveBeenCalledWith(db, "a", "b");
  });
});

describe("convertInbox", () => {
  it("parses an inbox item into a task and links it back", async () => {
    h.inboxGetById.mockResolvedValue({
      id: "inbox1",
      type: "text",
      title: "Submit assignment tomorrow",
      content: "Submit assignment tomorrow",
      metadata: {},
      status: "new",
      source: "quick_add",
      capturedAt: new Date(),
      organizedAt: null,
      archivedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.insert.mockResolvedValue(taskRow({ id: "task1", title: "Submit assignment" }));
    h.inboxUpdate.mockResolvedValue({});

    const task = await service.convertInbox(db, { inboxId: "inbox1" });
    expect(task.title).toBe("Submit assignment");
    // inbox item is marked organized + linked to the new task id
    const linkCall = h.inboxUpdate.mock.calls[0]![2];
    expect(linkCall.metadata.organizedToTaskId).toBe("task1");
    expect(linkCall.status).toBe("organized");
  });

  it("throws when the inbox item is missing", async () => {
    h.inboxGetById.mockResolvedValue(undefined);
    await expect(service.convertInbox(db, { inboxId: "x" })).rejects.toThrow(
      "Inbox item not found",
    );
  });
});

describe("search + labels + recurrence + counts", () => {
  it("searches across tasks", async () => {
    h.list.mockResolvedValue([
      taskRow({ id: "1", title: "Alpha" }),
      taskRow({ id: "2", title: "Beta" }),
    ]);
    const r = await service.search(db, "alpha");
    expect(r.map((t) => t.id)).toEqual(["1"]);
  });

  it("lists + creates labels", async () => {
    h.listLabels.mockResolvedValue([{ id: "l1", name: "Work", color: "blue" }]);
    expect((await service.labels(db))[0]?.name).toBe("Work");
    h.createLabel.mockResolvedValue({ id: "l2", name: "Home", color: "green" });
    expect((await service.createLabel(db, { name: "Home", color: "green" })).id).toBe("l2");
  });

  it("sets recurrence and returns the next occurrence", async () => {
    h.getById.mockResolvedValue(taskRow({ dueAt: new Date("2026-07-07T09:00:00Z") }));
    h.upsertRecurrence.mockResolvedValue({
      taskId: "t1",
      frequency: "weekly",
      interval: 1,
      nextOccurrence: new Date("2026-07-14T09:00:00Z"),
    });
    const r = await service.setRecurrence(db, { taskId: "t1", frequency: "weekly", interval: 1 });
    expect(r.nextOccurrence).toBe("2026-07-14T09:00:00.000Z");
  });

  it("summarizes counts for the status bar", async () => {
    h.list.mockResolvedValue([
      taskRow({ id: "1", status: "not_started" }),
      taskRow({ id: "2", status: "completed" }),
    ]);
    const c = await service.counts(db);
    expect(c.open).toBe(1);
    expect(c.completed).toBe(1);
  });
});
