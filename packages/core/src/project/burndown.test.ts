import { describe, expect, it } from "vitest";
import { at, iso, makeProject, makeTask } from "./fixtures";
import { computeBurndown } from "./burndown";

describe("burndown", () => {
  const now = at(2026, 6, 11);
  const project = makeProject({
    id: "p1",
    startDate: iso(2026, 6, 1),
    targetDate: iso(2026, 6, 11),
  });

  const tasks = [
    makeTask({ id: "a", projectId: "p1", status: "completed", completedAt: iso(2026, 6, 5) }),
    makeTask({ id: "b", projectId: "p1", status: "not_started" }),
  ];

  it("returns an empty series when there are no tasks", () => {
    expect(computeBurndown(project, [], now)).toEqual([]);
  });

  it("starts at the total remaining", () => {
    const points = computeBurndown(project, tasks, now);
    expect(points[0]?.remaining).toBe(2);
    expect(points[0]?.ideal).toBe(2);
  });

  it("burns down as tasks complete", () => {
    const points = computeBurndown(project, tasks, now);
    expect(points.at(-1)?.remaining).toBe(1);
  });

  it("draws the ideal line to zero at the end", () => {
    const points = computeBurndown(project, tasks, now);
    expect(points.at(-1)?.ideal).toBe(0);
  });

  it("produces one point per day across the window", () => {
    const points = computeBurndown(project, tasks, now);
    expect(points.length).toBe(11); // Jul 1 → Jul 11 inclusive
  });

  it("never reports negative remaining", () => {
    const allDone = [
      makeTask({ id: "a", projectId: "p1", status: "completed", completedAt: iso(2026, 6, 3) }),
      makeTask({ id: "b", projectId: "p1", status: "completed", completedAt: iso(2026, 6, 4) }),
    ];
    const points = computeBurndown(project, allDone, now);
    expect(points.every((p) => p.remaining >= 0)).toBe(true);
    expect(points.at(-1)?.remaining).toBe(0);
  });
});
