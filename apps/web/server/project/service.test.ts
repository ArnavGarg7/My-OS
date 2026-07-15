import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MilestoneRow, ObjectiveRow, ProjectRow, TaskRow } from "@myos/db/schema";

// ProjectService is server-only; mock the DB boundary (repository) and verify the
// engine wiring — hydration, derived analytics, mutations and history logging.
const h = vi.hoisted(() => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  insertProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  listMilestones: vi.fn(),
  listAllMilestones: vi.fn(),
  getMilestone: vi.fn(),
  insertMilestone: vi.fn(),
  setMilestoneCompleted: vi.fn(),
  listObjectives: vi.fn(),
  insertObjective: vi.fn(),
  setObjectiveValue: vi.fn(),
  getObjective: vi.fn(),
  listDependencies: vi.fn(),
  listDependenciesFor: vi.fn(),
  addDependency: vi.fn(),
  removeDependency: vi.fn(),
  listTasks: vi.fn(),
  tasksForProject: vi.fn(),
  tasksForProjects: vi.fn(),
  setTaskOwnership: vi.fn(),
  logHistory: vi.fn(),
  listHistory: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";

const db = {} as never;
const D = (s: string) => new Date(s);

function projectRow(over: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: "p1",
    name: "Campus AI",
    description: "",
    status: "active",
    priority: "high",
    color: "blue",
    owner: "",
    startDate: D("2026-07-01T00:00:00Z"),
    targetDate: D("2026-08-01T00:00:00Z"),
    completedAt: null,
    createdAt: D("2026-07-01T00:00:00Z"),
    updatedAt: D("2026-07-01T00:00:00Z"),
    ...over,
  };
}

function milestoneRow(over: Partial<MilestoneRow> = {}): MilestoneRow {
  return {
    id: "m1",
    projectId: "p1",
    title: "Alpha",
    description: "",
    dueDate: D("2026-07-20T00:00:00Z"),
    completed: false,
    order: 0,
    ...over,
  };
}

function objectiveRow(over: Partial<ObjectiveRow> = {}): ObjectiveRow {
  return {
    id: "o1",
    projectId: "p1",
    title: "Ship",
    targetValue: 10,
    currentValue: 0,
    unit: "features",
    completed: false,
    ...over,
  };
}

function taskRow(over: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "t1",
    title: "A task",
    description: "",
    status: "not_started",
    priority: "medium",
    estimatedMinutes: null,
    actualMinutes: null,
    dueAt: null,
    scheduledStart: null,
    scheduledEnd: null,
    completedAt: null,
    parentTaskId: null,
    projectId: "p1",
    milestoneId: null,
    objectiveId: null,
    createdAt: D("2026-07-01T00:00:00Z"),
    updatedAt: D("2026-07-01T00:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default hydration relations are empty.
  h.listMilestones.mockResolvedValue([]);
  h.listObjectives.mockResolvedValue([]);
  h.listDependenciesFor.mockResolvedValue([]);
  h.tasksForProject.mockResolvedValue([]);
  h.listTasks.mockResolvedValue([]);
  h.logHistory.mockResolvedValue(undefined);
});

describe("create", () => {
  it("validates, inserts and logs history", async () => {
    h.insertProject.mockResolvedValue(projectRow());
    const project = await service.create(db, { name: "Campus AI" });
    expect(project.name).toBe("Campus AI");
    expect(h.insertProject).toHaveBeenCalledOnce();
    expect(h.logHistory).toHaveBeenCalledWith(db, "p1", "created", { name: "Campus AI" });
  });

  it("rejects an invalid date range", async () => {
    await expect(
      service.create(db, {
        name: "X",
        startDate: "2026-08-01T00:00:00Z",
        targetDate: "2026-07-01T00:00:00Z",
      }),
    ).rejects.toThrow(/Target date/);
    expect(h.insertProject).not.toHaveBeenCalled();
  });

  it("persists provided priority and owner", async () => {
    h.insertProject.mockResolvedValue(projectRow({ priority: "critical", owner: "me" }));
    await service.create(db, { name: "X", priority: "critical", owner: "me" });
    const persisted = h.insertProject.mock.calls[0]?.[1] as { priority: string; owner: string };
    expect(persisted.priority).toBe("critical");
    expect(persisted.owner).toBe("me");
  });
});

describe("list / get", () => {
  it("hydrates a list of projects with relations", async () => {
    h.listProjects.mockResolvedValue([projectRow()]);
    h.listMilestones.mockResolvedValue([milestoneRow()]);
    h.listObjectives.mockResolvedValue([objectiveRow()]);
    h.listDependenciesFor.mockResolvedValue([{ projectId: "p1", dependsOn: "p2" }]);
    const [p] = await service.list(db, {});
    expect(p?.milestones).toHaveLength(1);
    expect(p?.objectives).toHaveLength(1);
    expect(p?.dependencies).toEqual(["p2"]);
  });

  it("throws when a project is missing", async () => {
    h.getProject.mockResolvedValue(undefined);
    await expect(service.get(db, "nope")).rejects.toThrow(/not found/);
  });

  it("passes the status filter to the repository", async () => {
    h.listProjects.mockResolvedValue([]);
    await service.list(db, { status: "active" });
    expect(h.listProjects).toHaveBeenCalledWith(db, "active");
  });
});

describe("update / archive", () => {
  it("applies a status transition through the engine", async () => {
    h.getProject.mockResolvedValue(projectRow({ status: "active" }));
    h.updateProject.mockResolvedValue(
      projectRow({ status: "completed", completedAt: D("2026-07-10T00:00:00Z") }),
    );
    const updated = await service.update(db, { id: "p1", status: "completed" });
    expect(updated.status).toBe("completed");
    expect(updated.completedAt).not.toBeNull();
    // The engine set completedAt before persistence.
    const persisted = h.updateProject.mock.calls[0]?.[2] as {
      status: string;
      completedAt: string | null;
    };
    expect(persisted.status).toBe("completed");
    expect(persisted.completedAt).not.toBeNull();
  });

  it("archives a project", async () => {
    h.getProject.mockResolvedValue(projectRow());
    h.updateProject.mockResolvedValue(projectRow({ status: "archived" }));
    const archived = await service.archive(db, "p1");
    expect(archived.status).toBe("archived");
    expect(h.logHistory).toHaveBeenCalledWith(db, "p1", "archived", {});
  });

  it("removes a project", async () => {
    h.deleteProject.mockResolvedValue(undefined);
    expect(await service.remove(db, "p1")).toEqual({ id: "p1" });
  });

  it("logs an update to history", async () => {
    h.getProject.mockResolvedValue(projectRow());
    h.updateProject.mockResolvedValue(projectRow({ name: "Renamed" }));
    await service.update(db, { id: "p1", name: "Renamed" });
    expect(h.logHistory).toHaveBeenCalledWith(db, "p1", "updated", {});
  });
});

describe("derived analytics", () => {
  beforeEach(() => {
    h.getProject.mockResolvedValue(projectRow());
  });

  it("derives progress from owned tasks", async () => {
    h.tasksForProject.mockResolvedValue([
      taskRow({ id: "a", status: "completed" }),
      taskRow({ id: "b", status: "not_started" }),
    ]);
    const p = await service.progress(db, "p1");
    expect(p.tasksPercent).toBe(50);
    expect(p.totalTasks).toBe(2);
  });

  it("derives health", async () => {
    h.getProject.mockResolvedValue(projectRow({ targetDate: D("2100-01-01T00:00:00Z") }));
    const health = await service.health(db, "p1");
    expect(health.status).toBe("healthy");
  });

  it("derives a forecast", async () => {
    h.tasksForProject.mockResolvedValue([taskRow({ id: "a", status: "completed" })]);
    const f = await service.forecast(db, "p1");
    expect(f.remainingTasks).toBe(0);
  });

  it("builds a timeline with milestone progress", async () => {
    h.getProject.mockResolvedValue(projectRow());
    h.listMilestones.mockResolvedValue([milestoneRow({ id: "m1" })]);
    h.tasksForProject.mockResolvedValue([
      taskRow({ id: "a", milestoneId: "m1", status: "completed" }),
      taskRow({ id: "b", milestoneId: "m1", status: "not_started" }),
    ]);
    const t = await service.timeline(db, "p1");
    expect(t.milestones[0]?.progress).toBe(50);
    expect(t.milestones[0]?.taskCount).toBe(2);
  });

  it("counts unassigned tasks in the timeline", async () => {
    h.getProject.mockResolvedValue(projectRow());
    h.tasksForProject.mockResolvedValue([
      taskRow({ id: "a", milestoneId: null }),
      taskRow({ id: "b", milestoneId: "m1" }),
    ]);
    const t = await service.timeline(db, "p1");
    expect(t.unassignedTaskCount).toBe(1);
  });

  it("derives a burndown series from completed tasks", async () => {
    h.getProject.mockResolvedValue(projectRow());
    h.tasksForProject.mockResolvedValue([
      taskRow({ id: "a", status: "completed", completedAt: D("2026-07-05T00:00:00Z") }),
      taskRow({ id: "b", status: "not_started" }),
    ]);
    const points = await service.burndown(db, "p1");
    expect(points.length).toBeGreaterThan(0);
    expect(points[0]?.remaining).toBe(2);
  });
});

describe("portfolio / roadmap", () => {
  it("summarizes the portfolio", async () => {
    h.listProjects.mockResolvedValue([projectRow(), projectRow({ id: "p2", status: "completed" })]);
    h.listTasks.mockResolvedValue([]);
    const s = await service.portfolio(db);
    expect(s.projectCount).toBe(2);
    expect(s.activeCount).toBe(1);
  });

  it("builds a roadmap from milestones", async () => {
    h.listProjects.mockResolvedValue([projectRow()]);
    h.listMilestones.mockResolvedValue([milestoneRow({ id: "m1" })]);
    const items = await service.roadmap(db);
    expect(items).toHaveLength(1);
    expect(items[0]?.milestoneId).toBe("m1");
  });

  it("counts blocked tasks in the portfolio", async () => {
    h.listProjects.mockResolvedValue([projectRow()]);
    h.listTasks.mockResolvedValue([taskRow({ id: "a", projectId: "p1", status: "blocked" })]);
    const s = await service.portfolio(db);
    expect(s.blockedTasks).toBe(1);
  });
});

describe("milestones", () => {
  it("creates a milestone at the end of the order", async () => {
    h.listMilestones.mockResolvedValue([milestoneRow({ id: "m1", order: 0 })]);
    h.insertMilestone.mockResolvedValue(milestoneRow({ id: "m2", order: 1, title: "Beta" }));
    const m = await service.createMilestone(db, { projectId: "p1", title: "Beta" });
    expect(m.title).toBe("Beta");
    expect(h.insertMilestone).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ order: 1, title: "Beta" }),
    );
  });

  it("completes a milestone", async () => {
    h.getMilestone.mockResolvedValue(milestoneRow());
    h.setMilestoneCompleted.mockResolvedValue(milestoneRow({ completed: true }));
    const m = await service.completeMilestone(db, "m1");
    expect(m.completed).toBe(true);
    expect(h.logHistory).toHaveBeenCalledWith(db, "p1", "milestone_completed", { id: "m1" });
  });
});

describe("objectives", () => {
  it("creates an objective", async () => {
    h.insertObjective.mockResolvedValue(objectiveRow());
    const o = await service.createObjective(db, {
      projectId: "p1",
      title: "Ship",
      targetValue: 10,
      unit: "features",
    });
    expect(o.title).toBe("Ship");
  });

  it("auto-completes an objective at its target", async () => {
    h.getObjective.mockResolvedValue(objectiveRow({ targetValue: 10, currentValue: 0 }));
    h.setObjectiveValue.mockImplementation(
      (_db: never, _id: string, currentValue: number, completed: boolean) =>
        Promise.resolve(objectiveRow({ currentValue, completed })),
    );
    const o = await service.updateObjective(db, { id: "o1", currentValue: 10 });
    expect(o.completed).toBe(true);
    expect(h.setObjectiveValue).toHaveBeenCalledWith(db, "o1", 10, true);
  });

  it("reports objective progress in a list", async () => {
    h.listObjectives.mockResolvedValue([objectiveRow({ currentValue: 5, targetValue: 10 })]);
    const [o] = await service.listObjectives(db, "p1");
    expect(o?.progress).toBe(50);
  });
});

describe("dependencies", () => {
  it("adds a dependency", async () => {
    h.listDependencies.mockResolvedValue([]);
    const r = await service.addDependency(db, { projectId: "p1", dependsOn: "p2" });
    expect(r.ok).toBe(true);
    expect(h.addDependency).toHaveBeenCalledWith(db, "p1", "p2");
  });

  it("rejects a cycle without persisting", async () => {
    h.listDependencies.mockResolvedValue([{ projectId: "p2", dependsOn: "p1" }]);
    const r = await service.addDependency(db, { projectId: "p1", dependsOn: "p2" });
    expect(r).toMatchObject({ ok: false, error: "cycle" });
    expect(h.addDependency).not.toHaveBeenCalled();
  });

  it("removes a dependency", async () => {
    const r = await service.removeDependency(db, { projectId: "p1", dependsOn: "p2" });
    expect(r.ok).toBe(true);
    expect(h.removeDependency).toHaveBeenCalledWith(db, "p1", "p2");
  });

  it("lists dependencies", async () => {
    h.listDependencies.mockResolvedValue([{ projectId: "p1", dependsOn: "p2" }]);
    expect(await service.listDependencies(db)).toEqual([{ projectId: "p1", dependsOn: "p2" }]);
  });
});

describe("task ownership", () => {
  it("attaches a task and logs history", async () => {
    h.setTaskOwnership.mockResolvedValue(taskRow({ id: "t9" }));
    const r = await service.attachTask(db, { taskId: "t9", projectId: "p1", milestoneId: "m1" });
    expect(r).toEqual({ id: "t9" });
    expect(h.setTaskOwnership).toHaveBeenCalledWith(db, "t9", {
      projectId: "p1",
      milestoneId: "m1",
      objectiveId: null,
    });
    expect(h.logHistory).toHaveBeenCalledWith(db, "p1", "task_attached", { taskId: "t9" });
  });

  it("detaches a task", async () => {
    h.setTaskOwnership.mockResolvedValue(taskRow({ id: "t9" }));
    await service.detachTask(db, "t9");
    expect(h.setTaskOwnership).toHaveBeenCalledWith(db, "t9", {
      projectId: null,
      milestoneId: null,
      objectiveId: null,
    });
  });

  it("does not log history when attaching to no project", async () => {
    h.setTaskOwnership.mockResolvedValue(taskRow({ id: "t9" }));
    await service.attachTask(db, { taskId: "t9", projectId: null });
    expect(h.logHistory).not.toHaveBeenCalled();
  });
});

describe("history / search / summary", () => {
  it("lists history", async () => {
    h.listHistory.mockResolvedValue([{ id: "h1" }]);
    expect(await service.history(db, "p1")).toEqual([{ id: "h1" }]);
  });

  it("lists milestones for a project", async () => {
    h.listMilestones.mockResolvedValue([milestoneRow({ id: "m1" }), milestoneRow({ id: "m2" })]);
    const ms = await service.listMilestones(db, "p1");
    expect(ms.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("searches by name", async () => {
    h.listProjects.mockResolvedValue([
      projectRow({ name: "Campus AI" }),
      projectRow({ id: "p2", name: "Fitness" }),
    ]);
    const out = await service.search(db, "campus");
    expect(out.map((p) => p.name)).toEqual(["Campus AI"]);
  });

  it("returns everything for an empty query", async () => {
    h.listProjects.mockResolvedValue([projectRow(), projectRow({ id: "p2" })]);
    expect(await service.search(db, "  ")).toHaveLength(2);
  });

  it("produces a per-project summary", async () => {
    h.getProject.mockResolvedValue(projectRow());
    h.listMilestones.mockResolvedValue([milestoneRow({ id: "m1" })]);
    const s = await service.summary(db, "p1");
    expect(s.progress).toBeDefined();
    expect(s.health).toBeDefined();
    expect(s.nextMilestone?.id).toBe("m1");
  });
});
