import { describe, expect, it } from "vitest";
import { at, iso, makeMilestone, makeProject, makeTask } from "./fixtures";
import { projectEngine } from "./engine";

describe("engine", () => {
  const now = at(2026, 6, 10);

  it("creates a project in planning with defaults", () => {
    const p = projectEngine.create({ name: "  Campus AI  " }, now);
    expect(p.name).toBe("Campus AI");
    expect(p.status).toBe("planning");
    expect(p.priority).toBe("medium");
    expect(p.color).toBe("blue");
    expect(p.milestones).toEqual([]);
    expect(p.createdAt).toBe(now.toISOString());
  });

  it("honours provided create fields", () => {
    const p = projectEngine.create(
      { name: "X", priority: "critical", color: "red", owner: "me", targetDate: iso(2026, 7, 1) },
      now,
    );
    expect(p.priority).toBe("critical");
    expect(p.color).toBe("red");
    expect(p.targetDate).toBe(iso(2026, 7, 1));
  });

  it("validates required name and date ordering", () => {
    expect(projectEngine.validate(makeProject({ name: "" }))).toContain("Name is required.");
    const bad = makeProject({ startDate: iso(2026, 7, 1), targetDate: iso(2026, 6, 1) });
    expect(projectEngine.validate(bad).length).toBe(1);
    expect(projectEngine.validate(makeProject({ name: "ok" }))).toEqual([]);
  });

  it("sets status and stamps updatedAt", () => {
    const later = at(2026, 6, 12);
    const p = projectEngine.setStatus(makeProject({ id: "p1" }), "active", later);
    expect(p.status).toBe("active");
    expect(p.updatedAt).toBe(later.toISOString());
  });

  it("completes a project and records completedAt", () => {
    const p = projectEngine.complete(makeProject({ id: "p1" }), now);
    expect(p.status).toBe("completed");
    expect(p.completedAt).toBe(now.toISOString());
  });

  it("archives a project", () => {
    expect(projectEngine.archive(makeProject({ id: "p1" }), now).status).toBe("archived");
  });

  it("delegates progress/health/forecast", () => {
    const project = makeProject({ id: "p1", startDate: iso(2026, 6, 1) });
    const tasks = [makeTask({ id: "a", projectId: "p1", status: "completed" })];
    expect(projectEngine.progress(project, tasks, now).tasksPercent).toBe(100);
    expect(projectEngine.health(project, tasks, now).status).toBe("healthy");
    expect(projectEngine.forecast(project, tasks, now).remainingTasks).toBe(0);
  });

  it("delegates portfolio and roadmap", () => {
    const projects = [
      makeProject({
        id: "p1",
        status: "active",
        milestones: [makeMilestone({ dueDate: iso(2026, 6, 20) })],
      }),
    ];
    expect(projectEngine.portfolio(projects, [], now).projectCount).toBe(1);
    expect(projectEngine.roadmap(projects).length).toBe(1);
  });

  it("trims the description on create", () => {
    expect(projectEngine.create({ name: "X", description: "  hi  " }, now).description).toBe("hi");
  });

  it("accepts equal start and target dates", () => {
    const p = makeProject({ startDate: iso(2026, 7, 1), targetDate: iso(2026, 7, 1) });
    expect(projectEngine.validate(p)).toEqual([]);
  });

  it("produces a per-project summary", () => {
    const project = makeProject({
      id: "p1",
      startDate: iso(2026, 6, 1),
      milestones: [makeMilestone({ id: "m1", dueDate: iso(2026, 6, 20) })],
    });
    const summary = projectEngine.summary(project, [], now);
    expect(summary.progress).toBeDefined();
    expect(summary.health).toBeDefined();
    expect(summary.forecast).toBeDefined();
    expect(summary.nextMilestone?.id).toBe("m1");
  });
});
