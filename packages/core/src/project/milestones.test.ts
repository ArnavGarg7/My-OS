import { describe, expect, it } from "vitest";
import { at, iso, makeMilestone, makeTask } from "./fixtures";
import {
  completeMilestone,
  milestoneCompletion,
  milestoneProgress,
  nextMilestone,
  overdueMilestones,
  sortMilestones,
} from "./milestones";

describe("milestones", () => {
  const now = at(2026, 6, 10);

  it("sorts by order then due date", () => {
    const ms = [
      makeMilestone({ id: "b", order: 1 }),
      makeMilestone({ id: "a", order: 0 }),
      makeMilestone({ id: "c", order: 0, dueDate: iso(2026, 5, 1) }),
    ];
    expect(sortMilestones(ms).map((m) => m.id)).toEqual(["c", "a", "b"]);
  });

  it("returns 100% for a completed milestone", () => {
    expect(milestoneProgress(makeMilestone({ completed: true }), [])).toBe(100);
  });

  it("returns 0% when a milestone has no tasks", () => {
    expect(milestoneProgress(makeMilestone({ id: "m1" }), [])).toBe(0);
  });

  it("computes milestone progress from its tasks", () => {
    const tasks = [
      makeTask({ id: "a", milestoneId: "m1", status: "completed" }),
      makeTask({ id: "b", milestoneId: "m1", status: "not_started" }),
    ];
    expect(milestoneProgress(makeMilestone({ id: "m1" }), tasks)).toBe(50);
  });

  it("detects overdue milestones", () => {
    const ms = [
      makeMilestone({ id: "late", dueDate: iso(2026, 6, 1) }),
      makeMilestone({ id: "future", dueDate: iso(2026, 6, 20) }),
      makeMilestone({ id: "done", dueDate: iso(2026, 6, 1), completed: true }),
    ];
    expect(overdueMilestones(ms, now).map((m) => m.id)).toEqual(["late"]);
  });

  it("finds the next upcoming incomplete milestone", () => {
    const ms = [
      makeMilestone({ id: "past", dueDate: iso(2026, 6, 1) }),
      makeMilestone({ id: "soon", dueDate: iso(2026, 6, 15) }),
      makeMilestone({ id: "later", dueDate: iso(2026, 6, 25) }),
    ];
    expect(nextMilestone(ms, now)?.id).toBe("soon");
  });

  it("falls back to an overdue milestone when none are upcoming", () => {
    const ms = [makeMilestone({ id: "past", dueDate: iso(2026, 6, 1) })];
    expect(nextMilestone(ms, now)?.id).toBe("past");
  });

  it("returns null when there are no incomplete milestones", () => {
    expect(nextMilestone([makeMilestone({ completed: true })], now)).toBeNull();
  });

  it("marks a milestone complete", () => {
    expect(completeMilestone(makeMilestone({ completed: false })).completed).toBe(true);
  });

  it("counts completion", () => {
    const ms = [makeMilestone({ completed: true }), makeMilestone({ completed: false })];
    expect(milestoneCompletion(ms)).toEqual({ completed: 1, total: 2 });
  });

  it("rounds milestone progress from partial task completion", () => {
    const tasks = [
      makeTask({ id: "a", milestoneId: "m1", status: "completed" }),
      makeTask({ id: "b", milestoneId: "m1", status: "not_started" }),
      makeTask({ id: "c", milestoneId: "m1", status: "not_started" }),
    ];
    expect(milestoneProgress(makeMilestone({ id: "m1" }), tasks)).toBe(33);
  });

  it("orders milestones with equal order by due date", () => {
    const ms = [
      makeMilestone({ id: "b", order: 0, dueDate: iso(2026, 6, 20) }),
      makeMilestone({ id: "a", order: 0, dueDate: iso(2026, 6, 10) }),
    ];
    expect(sortMilestones(ms).map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("treats a milestone with no due date as never overdue", () => {
    expect(overdueMilestones([makeMilestone({ dueDate: null })], now)).toEqual([]);
  });
});
