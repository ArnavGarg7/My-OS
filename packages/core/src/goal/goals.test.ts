import { describe, expect, it } from "vitest";
import { at, day, makeGoal } from "./fixtures";
import {
  activateGoal,
  archiveGoal,
  completeGoal,
  createGoal,
  setStatus,
  validateGoal,
} from "./goals";

const now = new Date(at(2026, 6, 7));

describe("goals", () => {
  it("creates a goal in planned state with defaults", () => {
    const g = createGoal({ title: "  Learn to cook  " }, now);
    expect(g.title).toBe("Learn to cook");
    expect(g.status).toBe("planned");
    expect(g.goalType).toBe("personal");
    expect(g.priority).toBe("medium");
  });

  it("validates title + date ordering", () => {
    expect(validateGoal(makeGoal({ title: "" }))).toContain("A goal needs a title.");
    const bad = makeGoal({ startedAt: at(2026, 6, 10), targetDate: day(2026, 6, 1) });
    expect(validateGoal(bad).length).toBe(1);
    expect(validateGoal(makeGoal({ title: "ok" }))).toEqual([]);
  });

  it("activates a goal, stamping startedAt", () => {
    const g = activateGoal(makeGoal({ startedAt: null }), now);
    expect(g.status).toBe("active");
    expect(g.startedAt).toBe(now.toISOString());
  });

  it("completes a goal", () => {
    const g = completeGoal(makeGoal(), now);
    expect(g.status).toBe("completed");
    expect(g.completedAt).toBe(now.toISOString());
  });

  it("archives a goal", () => {
    expect(archiveGoal(makeGoal(), now).status).toBe("archived");
  });

  it("routes setStatus through the right transition", () => {
    expect(setStatus(makeGoal(), "completed", now).completedAt).not.toBeNull();
    expect(setStatus(makeGoal(), "paused", now).status).toBe("paused");
  });
});
