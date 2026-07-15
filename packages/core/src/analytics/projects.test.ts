import { describe, expect, it } from "vitest";
import { computeProjects } from "./projects";
import { ev } from "./fixtures";

describe("computeProjects", () => {
  it("reads throughput from the snapshot", () => {
    const m = computeProjects([], {
      completed: 2,
      milestonesCompleted: 5,
      atRisk: 0,
      velocity: 3.5,
    });
    expect(m.projectsCompleted).toBe(2);
    expect(m.milestonesCompleted).toBe(5);
    expect(m.velocity).toBe(3.5);
    expect(m.burndownTrend).toBe("improving");
  });
  it("flags worsening burndown with multiple at-risk", () => {
    const m = computeProjects([], { completed: 0, milestonesCompleted: 0, atRisk: 3, velocity: 0 });
    expect(m.burndownTrend).toBe("worsening");
  });
  it("falls back to Timeline counts", () => {
    const m = computeProjects([
      ev({ eventType: "project.completed", source: "project" }),
      ev({ eventType: "milestone.completed", source: "project" }),
    ]);
    expect(m.projectsCompleted).toBe(1);
    expect(m.milestonesCompleted).toBe(1);
  });
  it("marks a flat burndown with one at-risk project", () => {
    const m = computeProjects([], { completed: 0, milestonesCompleted: 0, atRisk: 1, velocity: 2 });
    expect(m.burndownTrend).toBe("flat");
  });
  it("defaults to zeros without input or events", () => {
    const m = computeProjects([]);
    expect(m.projectsCompleted).toBe(0);
    expect(m.atRisk).toBe(0);
  });
});
