import { describe, expect, it } from "vitest";
import { at, iso, makeMilestone, makeObjective, makeProject, makeTask } from "./fixtures";
import { assessHealth } from "./health";

describe("health", () => {
  const now = at(2026, 6, 10);

  it("reports completed for a completed project", () => {
    const h = assessHealth(makeProject({ id: "p1", status: "completed" }), [], now);
    expect(h.status).toBe("completed");
    expect(h.score).toBe(100);
  });

  it("is healthy with no issues", () => {
    const project = makeProject({ id: "p1", targetDate: iso(2026, 7, 1) });
    const h = assessHealth(project, [], now);
    expect(h.status).toBe("healthy");
    expect(h.score).toBe(100);
  });

  it("penalizes overdue milestones", () => {
    const project = makeProject({
      id: "p1",
      milestones: [makeMilestone({ dueDate: iso(2026, 6, 1) })],
    });
    const h = assessHealth(project, [], now);
    expect(h.score).toBe(85);
    expect(h.reasons.join(" ")).toContain("overdue milestone");
  });

  it("penalizes blocked tasks", () => {
    const project = makeProject({ id: "p1" });
    const tasks = [makeTask({ id: "a", projectId: "p1", status: "blocked" })];
    const h = assessHealth(project, tasks, now);
    expect(h.score).toBe(90);
  });

  it("penalizes missed objectives", () => {
    const project = makeProject({
      id: "p1",
      objectives: [makeObjective({ currentValue: 0, targetValue: 10 })],
    });
    const h = assessHealth(project, [], now);
    expect(h.score).toBe(90);
  });

  it("penalizes an overdue target date", () => {
    const project = makeProject({ id: "p1", targetDate: iso(2026, 6, 1) });
    const h = assessHealth(project, [], now);
    expect(h.score).toBe(75);
    expect(h.reasons.join(" ")).toContain("Target date");
  });

  it("becomes blocked when blocked tasks drive the score below 60", () => {
    const project = makeProject({
      id: "p1",
      targetDate: iso(2026, 6, 1),
      milestones: [makeMilestone({ id: "m1", dueDate: iso(2026, 6, 1) })],
    });
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "blocked" }),
      makeTask({ id: "b", projectId: "p1", status: "blocked" }),
    ];
    const h = assessHealth(project, tasks, now);
    // 100 - 15 (overdue m) - 20 (2 blocked) - 25 (target) = 40 → blocked
    expect(h.status).toBe("blocked");
  });

  it("is at_risk in the 55–79 band", () => {
    const project = makeProject({ id: "p1", targetDate: iso(2026, 6, 1) });
    const h = assessHealth(project, [], now); // 75 → at_risk
    expect(h.status).toBe("at_risk");
  });

  it("is behind below 55", () => {
    const project = makeProject({
      id: "p1",
      targetDate: iso(2026, 6, 1),
      milestones: [
        makeMilestone({ id: "m1", dueDate: iso(2026, 6, 1) }),
        makeMilestone({ id: "m2", dueDate: iso(2026, 6, 2) }),
      ],
    });
    const h = assessHealth(project, [], now); // 100-30-25 = 45 → behind
    expect(h.status).toBe("behind");
  });

  it("accumulates multiple reasons", () => {
    const project = makeProject({
      id: "p1",
      targetDate: iso(2026, 6, 1),
      milestones: [makeMilestone({ id: "m1", dueDate: iso(2026, 6, 1) })],
      objectives: [makeObjective({ currentValue: 0, targetValue: 10 })],
    });
    const tasks = [makeTask({ id: "a", projectId: "p1", status: "blocked" })];
    const h = assessHealth(project, tasks, now);
    expect(h.reasons.length).toBe(4);
  });

  it("gives a default reason when healthy", () => {
    const h = assessHealth(makeProject({ id: "p1" }), [], now);
    expect(h.reasons).toEqual(["On track — no issues detected."]);
  });

  it("clamps the score at zero", () => {
    const project = makeProject({
      id: "p1",
      targetDate: iso(2026, 6, 1),
      milestones: Array.from({ length: 10 }, (_, i) =>
        makeMilestone({ id: `m${i}`, dueDate: iso(2026, 6, 1) }),
      ),
    });
    expect(assessHealth(project, [], now).score).toBe(0);
  });
});
