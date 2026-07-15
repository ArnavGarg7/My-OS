import { describe, expect, it } from "vitest";
import { computeScores } from "./scoring";
import { makeEvents } from "./fixtures";

const domain = {
  health: {
    avgReadiness: 85,
    avgSleepMinutes: 450,
    avgHydrationPercent: 100,
    recoveryScore: 90,
    workoutCount: 4,
  },
  finance: {
    totalIncome: 50000,
    totalExpense: 30000,
    budgetAdherence: 90,
    savingsRate: 40,
    subscriptionCost: 1200,
  },
  goals: {
    activeCount: 3,
    overallProgress: 70,
    objectivesCompleted: 2,
    habitConsistency: 80,
    completionRate: 60,
    forecastAccuracy: 75,
  },
  planner: {
    accuracy: 82,
    blocksCompleted: 8,
    blocksTotal: 10,
    regenerations: 1,
    lockedBlocks: 2,
    overflow: 0,
    utilization: 75,
  },
  journal: {
    writingStreak: 5,
    wordCount: 1200,
    reflectionCount: 4,
    moodTrend: 4,
    gratitudeCount: 6,
  },
};

describe("computeScores", () => {
  it("produces a full scoreboard in range", () => {
    const s = computeScores(makeEvents(), 7, domain);
    for (const key of [
      "productivity",
      "focus",
      "planner",
      "health",
      "goals",
      "finance",
      "journal",
      "overall",
    ] as const) {
      expect(s[key]).toBeGreaterThanOrEqual(0);
      expect(s[key]).toBeLessThanOrEqual(100);
    }
    expect(s.planner).toBe(82);
    expect(s.health).toBeGreaterThanOrEqual(85);
  });
  it("overall is a weighted blend, not a raw max", () => {
    const s = computeScores(makeEvents(), 7, domain);
    const subs = [s.productivity, s.focus, s.planner, s.health, s.goals, s.finance, s.journal];
    expect(s.overall).toBeLessThanOrEqual(Math.max(...subs));
    expect(s.overall).toBeGreaterThanOrEqual(Math.min(...subs));
  });
  it("degrades to low scores with no data", () => {
    const s = computeScores([], 7, {});
    expect(s.overall).toBeLessThan(20);
  });
});
