import { describe, expect, it } from "vitest";
import { at, makeTask } from "./fixtures";
import {
  attachTask,
  detachTask,
  tasksForMilestone,
  tasksForObjective,
  tasksForProject,
  unassignedTasks,
} from "./hierarchy";

describe("hierarchy", () => {
  const now = at(2026, 6, 10);

  it("groups tasks by project", () => {
    const tasks = [makeTask({ id: "a", projectId: "p1" }), makeTask({ id: "b", projectId: "p2" })];
    expect(tasksForProject(tasks, "p1").map((t) => t.id)).toEqual(["a"]);
  });

  it("groups tasks by milestone", () => {
    const tasks = [
      makeTask({ id: "a", milestoneId: "m1" }),
      makeTask({ id: "b", milestoneId: null }),
    ];
    expect(tasksForMilestone(tasks, "m1").map((t) => t.id)).toEqual(["a"]);
  });

  it("groups tasks by objective", () => {
    const tasks = [
      makeTask({ id: "a", objectiveId: "o1" }),
      makeTask({ id: "b", objectiveId: "o2" }),
    ];
    expect(tasksForObjective(tasks, "o1").map((t) => t.id)).toEqual(["a"]);
  });

  it("attaches a task to a project/milestone/objective", () => {
    const task = makeTask({ projectId: null, milestoneId: null, objectiveId: null });
    const next = attachTask(task, { projectId: "p9", milestoneId: "m9", objectiveId: "o9" }, now);
    expect(next.projectId).toBe("p9");
    expect(next.milestoneId).toBe("m9");
    expect(next.objectiveId).toBe("o9");
    expect(next.updatedAt).toBe(now.toISOString());
  });

  it("only overwrites the provided attachment fields", () => {
    const task = makeTask({ projectId: "p1", milestoneId: "m1", objectiveId: "o1" });
    const next = attachTask(task, { milestoneId: "m2" }, now);
    expect(next.projectId).toBe("p1");
    expect(next.milestoneId).toBe("m2");
    expect(next.objectiveId).toBe("o1");
  });

  it("detaches a task from the hierarchy", () => {
    const task = makeTask({ projectId: "p1", milestoneId: "m1", objectiveId: "o1" });
    const next = detachTask(task, now);
    expect(next.projectId).toBeNull();
    expect(next.milestoneId).toBeNull();
    expect(next.objectiveId).toBeNull();
  });

  it("does not mutate the original task", () => {
    const task = makeTask({ projectId: "p1" });
    detachTask(task, now);
    expect(task.projectId).toBe("p1");
  });

  it("finds unassigned tasks", () => {
    const tasks = [makeTask({ id: "a", projectId: null }), makeTask({ id: "b", projectId: "p1" })];
    expect(unassignedTasks(tasks).map((t) => t.id)).toEqual(["a"]);
  });

  it("can detach a task from a project while leaving other fields", () => {
    const task = makeTask({ projectId: "p1", milestoneId: "m1" });
    const next = attachTask(task, { projectId: null }, now);
    expect(next.projectId).toBeNull();
    expect(next.milestoneId).toBe("m1");
  });

  it("treats a milestone-only task with no project as unassigned", () => {
    const tasks = [makeTask({ id: "a", projectId: null, milestoneId: "m1" })];
    expect(unassignedTasks(tasks).map((t) => t.id)).toEqual(["a"]);
  });
});
