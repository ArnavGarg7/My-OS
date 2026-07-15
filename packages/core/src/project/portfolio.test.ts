import { describe, expect, it } from "vitest";
import { at, iso, makeMilestone, makeProject, makeTask } from "./fixtures";
import { summarize } from "./portfolio";

describe("portfolio", () => {
  const now = at(2026, 6, 10);

  const projects = [
    makeProject({ id: "p1", status: "active", targetDate: iso(2026, 6, 1) }), // overdue → at_risk
    makeProject({ id: "p2", status: "active" }), // healthy
    makeProject({ id: "p3", status: "completed" }),
  ];
  const tasks = [
    makeTask({ id: "a", projectId: "p1", status: "completed" }),
    makeTask({ id: "b", projectId: "p1", status: "blocked" }),
  ];

  it("counts projects and active projects", () => {
    const s = summarize(projects, tasks, now);
    expect(s.projectCount).toBe(3);
    expect(s.activeCount).toBe(2);
  });

  it("distributes health across projects", () => {
    const s = summarize(projects, tasks, now);
    expect(s.healthDistribution.completed).toBe(1);
    expect(s.healthDistribution.healthy).toBe(1);
    expect(s.atRiskCount).toBe(1);
  });

  it("counts open milestones on active projects", () => {
    const withMs = [
      makeProject({
        id: "p1",
        status: "active",
        milestones: [
          makeMilestone({ completed: false }),
          makeMilestone({ id: "m2", completed: true }),
        ],
      }),
    ];
    expect(summarize(withMs, [], now).openMilestones).toBe(1);
  });

  it("counts blocked tasks belonging to projects", () => {
    expect(summarize(projects, tasks, now).blockedTasks).toBe(1);
  });

  it("lists upcoming deadlines within the window, sorted", () => {
    const withDeadlines = [
      makeProject({
        id: "p1",
        status: "active",
        milestones: [
          makeMilestone({ id: "soon", title: "Soon", dueDate: iso(2026, 6, 12) }),
          makeMilestone({ id: "later", title: "Later", dueDate: iso(2026, 6, 30) }),
        ],
      }),
    ];
    const s = summarize(withDeadlines, [], now);
    expect(s.upcomingDeadlines.map((d) => d.title)).toEqual(["Soon"]);
  });

  it("averages overall completion across all projects", () => {
    const s = summarize(projects, tasks, now);
    expect(s.overallCompletion).toBeGreaterThanOrEqual(0);
    expect(s.overallCompletion).toBeLessThanOrEqual(100);
  });

  it("returns zeros for an empty portfolio", () => {
    const s = summarize([], [], now);
    expect(s.projectCount).toBe(0);
    expect(s.overallCompletion).toBe(0);
  });

  it("excludes completed milestones from upcoming deadlines", () => {
    const withDone = [
      makeProject({
        id: "p1",
        status: "active",
        milestones: [makeMilestone({ id: "done", completed: true, dueDate: iso(2026, 6, 12) })],
      }),
    ];
    expect(summarize(withDone, [], now).upcomingDeadlines).toEqual([]);
  });

  it("ignores blocked tasks that belong to no known project", () => {
    const orphan = [makeTask({ id: "x", projectId: null, status: "blocked" })];
    expect(summarize(projects, orphan, now).blockedTasks).toBe(0);
  });
});
