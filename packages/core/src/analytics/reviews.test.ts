import { describe, expect, it } from "vitest";
import { buildReview } from "./reviews";
import { makeContext } from "./fixtures";

describe("buildReview", () => {
  it("assembles a weekly review with scores + highlights", () => {
    const ctx = makeContext({
      projects: { completed: 1, milestonesCompleted: 2, atRisk: 2, velocity: 3 },
      goals: {
        activeCount: 3,
        overallProgress: 70,
        objectivesCompleted: 2,
        habitConsistency: 80,
        completionRate: 60,
        forecastAccuracy: 75,
      },
      finance: {
        totalIncome: 40000,
        totalExpense: 30000,
        budgetAdherence: 60,
        savingsRate: 25,
        subscriptionCost: 1000,
      },
    });
    const r = buildReview("weekly", ctx);
    expect(r.reportType).toBe("weekly");
    expect(r.productivity.tasksCompleted).toBeGreaterThanOrEqual(0);
    expect(r.highlights.largestExpense).toBe(15000);
    expect(r.highlights.bestHabit).toBe("Meditate"); // 2 completions vs 1
    expect(r.achievements).toContain("Finished 1 projects");
    expect(r.upcomingRisks).toContain("2 projects at risk");
  });

  it("flags bottlenecks from thresholds", () => {
    const ctx = makeContext({
      health: {
        avgReadiness: 40,
        avgSleepMinutes: 300,
        avgHydrationPercent: 50,
        recoveryScore: 40,
        workoutCount: 0,
      },
      planner: {
        accuracy: 40,
        blocksCompleted: 2,
        blocksTotal: 10,
        regenerations: 5,
        lockedBlocks: 0,
        overflow: 3,
        utilization: 40,
      },
    });
    const r = buildReview("weekly", ctx);
    expect(r.bottlenecks).toContain("Low average readiness");
    expect(r.bottlenecks).toContain("Planner accuracy below target");
  });

  it("spans a larger window for monthly", () => {
    const r = buildReview("monthly", makeContext());
    expect(r.reportType).toBe("monthly");
    // 30-day window includes the Jul 4 rent expense
    expect(r.highlights.largestExpense).toBe(15000);
  });

  it("produces bounded scores", () => {
    const r = buildReview("weekly", makeContext());
    expect(r.scores.overall).toBeGreaterThanOrEqual(0);
    expect(r.scores.overall).toBeLessThanOrEqual(100);
  });

  it("names the top decision", () => {
    const r = buildReview("weekly", makeContext());
    expect(r.highlights.topDecision).toBe("Ship it");
  });

  it("records the most productive day", () => {
    const r = buildReview("weekly", makeContext());
    expect(r.highlights.mostProductiveDay?.date).toBe("2026-07-06");
  });

  it("has empty risk/bottleneck lists for a clean healthy week", () => {
    const r = buildReview(
      "weekly",
      makeContext({
        health: {
          avgReadiness: 85,
          avgSleepMinutes: 460,
          avgHydrationPercent: 100,
          recoveryScore: 90,
          workoutCount: 4,
        },
        planner: {
          accuracy: 90,
          blocksCompleted: 9,
          blocksTotal: 10,
          regenerations: 0,
          lockedBlocks: 2,
          overflow: 0,
          utilization: 80,
        },
        projects: { completed: 1, milestonesCompleted: 1, atRisk: 0, velocity: 3 },
      }),
    );
    expect(r.upcomingRisks).toHaveLength(0);
    expect(r.bottlenecks).not.toContain("Planner accuracy below target");
  });
});
