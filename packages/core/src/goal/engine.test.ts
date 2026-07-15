import { describe, expect, it } from "vitest";
import { at, day, makeGoal, makeHabit, makeKeyResult, makeObjective } from "./fixtures";
import { goalEngine, isQuarterEnding } from "./engine";

const now = new Date(at(2026, 6, 1));

describe("GoalEngine", () => {
  it("creates + validates a goal", () => {
    const g = goalEngine.create({ title: "Run a 5k" }, now);
    expect(goalEngine.validate(g)).toEqual([]);
    expect(goalEngine.validate({ ...g, title: "" })).not.toEqual([]);
  });

  it("summarizes a goal (progress + forecast)", () => {
    const goal = makeGoal({
      startedAt: at(2026, 5, 1),
      objectives: [
        makeObjective({
          keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 50 })],
        }),
      ],
    });
    const s = goalEngine.summary(goal, now);
    expect(s.progress.overall).toBe(50);
    expect(s.forecast.velocityPerDay).toBeGreaterThan(0);
  });

  it("builds a portfolio across goals", () => {
    const goals = [
      makeGoal({
        id: "a",
        status: "active",
        objectives: [
          makeObjective({
            keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 80 })],
          }),
        ],
      }),
      makeGoal({
        id: "b",
        status: "active",
        objectives: [
          makeObjective({
            keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 40 })],
          }),
        ],
      }),
      makeGoal({ id: "c", status: "archived" }),
    ];
    const p = goalEngine.portfolio(goals, now);
    expect(p.activeCount).toBe(2);
    expect(p.overallProgress).toBe(60);
  });

  it("reports the best current habit streak in the portfolio", () => {
    const goals = [
      makeGoal({
        id: "a",
        status: "active",
        habits: [makeHabit({ history: [day(2026, 5, 29), day(2026, 5, 30), day(2026, 6, 1)] })],
      }),
    ];
    expect(goalEngine.portfolio(goals, now).habitStreak).toBe(3);
  });

  it("derives signals (behind goals + at-risk habits)", () => {
    const goals = [
      makeGoal({
        id: "a",
        status: "active",
        startedAt: at(2026, 5, 1),
        targetDate: day(2026, 6, 5),
        objectives: [
          makeObjective({
            keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 5 })],
          }),
        ],
        habits: [
          makeHabit({
            frequency: "daily",
            lastCompleted: day(2026, 5, 20),
            history: [day(2026, 5, 20)],
          }),
        ],
      }),
    ];
    const sig = goalEngine.signals(goals, now);
    expect(sig.behindGoals.length).toBeGreaterThan(0);
    expect(sig.habitsAtRisk.length).toBeGreaterThan(0);
  });

  it("detects a quarter ending", () => {
    expect(isQuarterEnding(new Date(Date.UTC(2026, 2, 28, 12)))).toBe(true); // late March
    expect(isQuarterEnding(new Date(Date.UTC(2026, 6, 1, 12)))).toBe(false); // early July
  });
});
