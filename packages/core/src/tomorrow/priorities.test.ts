import { describe, expect, it } from "vitest";
import { priorityScore, rankPriorities, selectPriorities } from "./priorities";
import { makePriorities } from "./fixtures";

describe("priorityScore", () => {
  it("weights task priority most heavily", () => {
    const taskHeavy = priorityScore({
      id: "a",
      kind: "task",
      title: "A",
      entityId: "1",
      taskPriority: 3,
    });
    const calendarHeavy = priorityScore({
      id: "b",
      kind: "task",
      title: "B",
      entityId: "2",
      calendarLoad: 3,
    });
    expect(taskHeavy).toBeGreaterThan(calendarHeavy);
  });
  it("is zero with no inputs", () => {
    expect(priorityScore({ id: "a", kind: "task", title: "A", entityId: "1" })).toBe(0);
  });
});

describe("rankPriorities", () => {
  it("sorts by score and assigns ranks", () => {
    const sel = rankPriorities(makePriorities());
    expect(sel.ranked[0]!.rank).toBe(1);
    expect(sel.ranked[0]!.score).toBeGreaterThanOrEqual(sel.ranked[1]!.score);
  });
  it("splits into top 3 + optional (up to 5)", () => {
    const sel = rankPriorities(makePriorities());
    expect(sel.top).toHaveLength(3);
    expect(sel.optional).toHaveLength(2);
  });
  it("handles fewer than 3 candidates", () => {
    const sel = rankPriorities(makePriorities().slice(0, 2));
    expect(sel.top).toHaveLength(2);
    expect(sel.optional).toHaveLength(0);
  });
});

describe("selectPriorities", () => {
  it("returns chosen priorities in rank order, capped at 5", () => {
    const sel = rankPriorities(makePriorities());
    const chosen = selectPriorities(sel, ["p5", "p1", "p3"]);
    expect(chosen.map((p) => p.id)).toContain("p1");
    expect(chosen.length).toBeLessThanOrEqual(5);
    // preserves rank order (descending score)
    expect(chosen[0]!.score).toBeGreaterThanOrEqual(chosen[chosen.length - 1]!.score);
  });
  it("returns nothing when nothing chosen", () => {
    expect(selectPriorities(rankPriorities(makePriorities()), [])).toHaveLength(0);
  });
  it("ignores unknown ids", () => {
    expect(selectPriorities(rankPriorities(makePriorities()), ["nope"])).toHaveLength(0);
  });
});

describe("priorityScore weighting", () => {
  it("sums weighted components", () => {
    // taskPriority 2 (*3) + projectUrgency 1 (*2.5) = 6 + 2.5 = 8.5
    expect(
      priorityScore({
        id: "a",
        kind: "task",
        title: "A",
        entityId: "1",
        taskPriority: 2,
        projectUrgency: 1,
      }),
    ).toBe(8.5);
  });
  it("goal deadline outranks planner overflow", () => {
    const goal = priorityScore({
      id: "a",
      kind: "goal",
      title: "A",
      entityId: "1",
      goalDeadline: 3,
    });
    const overflow = priorityScore({
      id: "b",
      kind: "task",
      title: "B",
      entityId: "2",
      plannerOverflow: 3,
    });
    expect(goal).toBeGreaterThan(overflow);
  });
  it("breaks score ties by title", () => {
    const sel = rankPriorities([
      { id: "b", kind: "task", title: "Bravo", entityId: "1", taskPriority: 1 },
      { id: "a", kind: "task", title: "Alpha", entityId: "2", taskPriority: 1 },
    ]);
    expect(sel.ranked[0]!.title).toBe("Alpha");
  });
});
