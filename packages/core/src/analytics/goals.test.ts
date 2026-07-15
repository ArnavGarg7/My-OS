import { describe, expect, it } from "vitest";
import { computeGoals, goalVelocity } from "./goals";
import { makeEvents } from "./fixtures";

const input = {
  activeCount: 3,
  overallProgress: 70,
  objectivesCompleted: 2,
  habitConsistency: 80,
  completionRate: 60,
  forecastAccuracy: 75,
};

describe("goalVelocity", () => {
  it("counts advancing events per week", () => {
    // makeEvents has 3 habit.completed + 1 goal.completed = 4 advancing over 7 days
    expect(goalVelocity(makeEvents(), 7)).toBe(4);
  });
  it("scales by span", () => {
    expect(goalVelocity(makeEvents(), 14)).toBe(2);
  });
});

describe("computeGoals", () => {
  it("blends progress + consistency + completion", () => {
    const m = computeGoals(makeEvents(), 7, input);
    expect(m.score).toBe(71); // 70*0.5 + 80*0.3 + 60*0.2 = 71
    expect(m.velocity).toBe(4);
    expect(m.activeCount).toBe(3);
  });
  it("defaults to zero without input", () => {
    expect(computeGoals([], 7).score).toBe(0);
  });

  it("clamps sub-metrics into range", () => {
    const m = computeGoals([], 7, { ...input, overallProgress: 150, habitConsistency: -10 });
    expect(m.overallProgress).toBe(100);
    expect(m.habitConsistency).toBe(0);
  });

  it("counts objectives completed from the snapshot", () => {
    expect(computeGoals([], 7, input).objectivesCompleted).toBe(2);
  });
});
