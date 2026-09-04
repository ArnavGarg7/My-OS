import { describe, expect, it } from "vitest";
import { makeGoal, makeHabit, makeKeyResult, makeObjective } from "./fixtures";
import { goalProgress } from "./progress";

// Completion % counts only history within the recency window of *today*, so the
// "recent" fixture must be relative to now — a hardcoded date silently decays to 0.
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const recent = [daysAgo(2), daysAgo(1), daysAgo(0)];

describe("progress", () => {
  it("returns 100 for a completed goal", () => {
    expect(goalProgress(makeGoal({ status: "completed" })).overall).toBe(100);
  });

  it("uses objectives-only progress when there are no habits", () => {
    const goal = makeGoal({
      objectives: [
        makeObjective({
          keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 60 })],
        }),
      ],
    });
    expect(goalProgress(goal).overall).toBe(60);
  });

  it("uses habits-only progress when there are no objectives", () => {
    const goal = makeGoal({ objectives: [], habits: [makeHabit({ history: recent })] });
    const p = goalProgress(goal);
    expect(p.habitsPercent).toBeGreaterThan(0);
    expect(p.overall).toBe(p.habitsPercent);
  });

  it("blends objectives (0.7) + habits (0.3)", () => {
    const goal = makeGoal({
      objectives: [
        makeObjective({
          keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 100 })],
        }),
      ],
      habits: [makeHabit({ history: [] })],
    });
    // objectives 100*0.7 + habits 0*0.3 = 70
    expect(goalProgress(goal).overall).toBe(70);
  });

  it("reports objective counts", () => {
    const goal = makeGoal({
      objectives: [
        makeObjective({ id: "a", status: "completed" }),
        makeObjective({ id: "b", status: "active" }),
      ],
    });
    const p = goalProgress(goal);
    expect(p.completedObjectives).toBe(1);
    expect(p.totalObjectives).toBe(2);
  });

  it("is 0 for an empty goal", () => {
    expect(goalProgress(makeGoal()).overall).toBe(0);
  });
});
