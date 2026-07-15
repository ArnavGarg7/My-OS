import { describe, expect, it } from "vitest";
import { day, makeGoal } from "./fixtures";
import { filterGoals, searchGoals, selectActive, sortGoals, topGoal } from "./selectors";

describe("selectors", () => {
  it("selects open goals", () => {
    const goals = [
      makeGoal({ id: "a", status: "active" }),
      makeGoal({ id: "b", status: "archived" }),
      makeGoal({ id: "c", status: "planned" }),
    ];
    expect(selectActive(goals).map((g) => g.id)).toEqual(["a", "c"]);
  });

  it("filters by status + type", () => {
    const goals = [
      makeGoal({ id: "a", status: "active", goalType: "health" }),
      makeGoal({ id: "b", status: "paused", goalType: "career" }),
    ];
    expect(filterGoals(goals, { goalType: "health" }).map((g) => g.id)).toEqual(["a"]);
    expect(filterGoals(goals, { status: "paused" }).map((g) => g.id)).toEqual(["b"]);
  });

  it("sorts by priority", () => {
    const goals = [
      makeGoal({ id: "low", priority: "low" }),
      makeGoal({ id: "crit", priority: "critical" }),
      makeGoal({ id: "med", priority: "medium" }),
    ];
    expect(sortGoals(goals, "priority").map((g) => g.id)).toEqual(["crit", "med", "low"]);
  });

  it("sorts by target date", () => {
    const goals = [
      makeGoal({ id: "late", targetDate: day(2026, 11, 1) }),
      makeGoal({ id: "soon", targetDate: day(2026, 6, 1) }),
    ];
    expect(sortGoals(goals, "target").map((g) => g.id)).toEqual(["soon", "late"]);
  });

  it("searches by title + description", () => {
    const goals = [
      makeGoal({ id: "a", title: "Run a marathon" }),
      makeGoal({ id: "b", title: "Save money", description: "emergency fund" }),
    ];
    expect(searchGoals(goals, "marathon").map((g) => g.id)).toEqual(["a"]);
    expect(searchGoals(goals, "emergency").map((g) => g.id)).toEqual(["b"]);
  });

  it("picks the top active goal by priority", () => {
    const goals = [
      makeGoal({ id: "low", status: "active", priority: "low" }),
      makeGoal({ id: "high", status: "active", priority: "high" }),
      makeGoal({ id: "crit-archived", status: "archived", priority: "critical" }),
    ];
    expect(topGoal(goals)?.id).toBe("high");
  });
});
