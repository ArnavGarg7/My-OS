import { describe, expect, it } from "vitest";
import { analyticsEngine } from "./engine";
import { makeContext } from "./fixtures";

const ctx = makeContext({
  health: {
    avgReadiness: 80,
    avgSleepMinutes: 440,
    avgHydrationPercent: 90,
    recoveryScore: 80,
    workoutCount: 3,
  },
  finance: {
    totalIncome: 40000,
    totalExpense: 25000,
    budgetAdherence: 85,
    savingsRate: 35,
    subscriptionCost: 900,
  },
  goals: {
    activeCount: 2,
    overallProgress: 65,
    objectivesCompleted: 1,
    habitConsistency: 70,
    completionRate: 55,
    forecastAccuracy: 70,
  },
  planner: {
    accuracy: 78,
    blocksCompleted: 7,
    blocksTotal: 9,
    regenerations: 1,
    lockedBlocks: 2,
    overflow: 0,
    utilization: 70,
  },
  journal: {
    writingStreak: 3,
    wordCount: 800,
    reflectionCount: 3,
    moodTrend: 4,
    gratitudeCount: 4,
  },
});

describe("AnalyticsEngine", () => {
  it("summary bundles scores + core metrics", () => {
    const s = analyticsEngine.summary(ctx, "weekly");
    expect(s.reportType).toBe("weekly");
    expect(s.scores.overall).toBeGreaterThan(0);
    expect(s.productivity.tasksCompleted).toBeGreaterThanOrEqual(0);
    expect(s.timeline.totalEvents).toBeGreaterThan(0);
  });

  it("exposes each domain engine", () => {
    expect(analyticsEngine.productivity(ctx).score).toBeGreaterThanOrEqual(0);
    expect(analyticsEngine.focus(ctx).score).toBeGreaterThanOrEqual(0);
    expect(analyticsEngine.planner(ctx).accuracy).toBe(78);
    expect(analyticsEngine.calendar(ctx).meetingHours).toBeGreaterThanOrEqual(0);
    expect(analyticsEngine.health(ctx).score).toBeGreaterThan(0);
    expect(analyticsEngine.finance(ctx).score).toBeGreaterThan(0);
    expect(analyticsEngine.goals(ctx).velocity).toBeGreaterThanOrEqual(0);
    expect(analyticsEngine.projects(ctx).burndownTrend).toBeDefined();
    expect(analyticsEngine.journal(ctx).entries).toBeGreaterThanOrEqual(0);
    expect(analyticsEngine.timeline(ctx).totalEvents).toBeGreaterThanOrEqual(0);
  });

  it("builds reviews, trends, comparisons + forecasts", () => {
    expect(analyticsEngine.review(ctx, "weekly").scores.overall).toBeGreaterThanOrEqual(0);
    expect(["up", "down", "flat"]).toContain(analyticsEngine.trend(ctx, "week").direction);
    expect(analyticsEngine.compare(ctx, "previous_week").metric).toBe("timeline.events");
    expect(analyticsEngine.forecast(ctx, 7).basis).toBe("historical-velocity");
    expect(analyticsEngine.statistics(ctx).totalEvents).toBeGreaterThan(0);
  });
});
