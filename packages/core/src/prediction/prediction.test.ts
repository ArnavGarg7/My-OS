import { describe, expect, it } from "vitest";
import {
  movingAverage,
  slope,
  velocity,
  computeTrend,
  computeConfidence,
  forecastGoal,
  forecastDeadline,
  forecastSchedule,
  forecastWorkload,
  forecastStudy,
  forecastProject,
  forecastHealth,
  forecastHabit,
  runPredictionEngine,
  simulateScenario,
  buildPredictionTimeline,
  predictionSignals,
  riskForecasts,
  opportunityForecasts,
  chiefForecasts,
  forecastCounts,
} from "./index";

/**
 * Predictive Intelligence Engine (Sprint 6.2). Deterministic forecasts from historical inputs —
 * confidence-scored, explainable, immutable. No AI, no randomness. All time injected.
 */

let counter = 0;
const newId = () => `p${(counter += 1)}`;
const now = new Date("2026-07-20T09:00:00.000Z");
const deps = { newId, now };

describe("trend analysis", () => {
  it("computes moving average, slope and velocity deterministically", () => {
    expect(movingAverage([2, 4, 6])).toBe(4);
    expect(slope([1, 2, 3, 4])).toBeGreaterThan(0);
    expect(slope([4, 3, 2, 1])).toBeLessThan(0);
    expect(velocity(12, 5)).toBe(2.4);
  });
  it("labels a rising/falling/flat trend", () => {
    expect(computeTrend("x", [1, 2, 3, 4]).direction).toBe("rising");
    expect(computeTrend("x", [4, 3, 2, 1]).direction).toBe("falling");
    expect(computeTrend("x", [3, 3, 3]).direction).toBe("flat");
  });
});

describe("confidence engine", () => {
  it("is higher for rich/stable/near histories and lower for sparse/long horizons", () => {
    const strong = computeConfidence({
      samples: 14,
      variability: 0.1,
      missingFraction: 0,
      horizonDays: 2,
    });
    const weak = computeConfidence({
      samples: 2,
      variability: 0.9,
      missingFraction: 0.5,
      horizonDays: 30,
    });
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(["very_high", "high"]).toContain(strong.level);
    expect(weak.level).toBe("low");
    expect(strong.reasons.length).toBeGreaterThan(0);
  });
});

describe("forecast models — deterministic + explainable", () => {
  it("goal: predicts completion probability + pace", () => {
    const p = forecastGoal(
      {
        id: "g1",
        label: "Ship 6.2",
        progress: 40,
        progressHistory: [3, 3, 4, 3],
        daysRemaining: 10,
      },
      deps,
    );
    expect(p.kind).toBe("goal");
    expect(p.metrics.completionProbability).toBeGreaterThanOrEqual(0);
    expect(p.explanation.calculations.length).toBeGreaterThan(0);
  });
  it("deadline: flags a slip when velocity can't clear remaining work", () => {
    const p = forecastDeadline(
      { id: "t1", label: "Essay", remainingTasks: 18, completionVelocity: 2.4, availableDays: 5 },
      deps,
    );
    expect(p.outlook).toBe("at_risk");
    expect(p.metrics.slipDays).toBeGreaterThan(0);
    expect(p.explanation.calculations).toEqual(
      expect.arrayContaining([{ label: "Average completion velocity", value: "2.4 tasks/day" }]),
    );
  });
  it("schedule/workload/study/project/health/habit all produce predictions", () => {
    expect(
      forecastSchedule(
        { bookedMinutesByDay: [500, 480, 120, 90, 510], dayCapacityMinutes: 480 },
        deps,
      ).kind,
    ).toBe("schedule");
    expect(
      forecastWorkload({ workloadHistory: [80, 85, 90], readinessHistory: [60, 50, 40] }, deps)
        .metrics.burnoutProbability,
    ).toBeGreaterThan(0);
    expect(
      forecastStudy(
        {
          id: "s1",
          label: "Algo",
          syllabusPercent: 30,
          studyHistory: [60, 45, 30],
          daysToExam: 10,
        },
        deps,
      ).kind,
    ).toBe("study");
    expect(
      forecastProject(
        {
          id: "pr1",
          label: "App",
          progress: 50,
          velocityHistory: [2, 3, 2],
          blockedTasks: 2,
          targetDays: 10,
        },
        deps,
      ).kind,
    ).toBe("project");
    expect(
      forecastHealth(
        { readinessHistory: [70, 65, 60], sleepHistory: [7, 6.5, 6], workoutDays: [1, 0, 1, 0, 1] },
        deps,
      ).kind,
    ).toBe("health");
    expect(
      forecastHabit(
        { id: "h1", label: "Read", currentStreak: 5, adherenceHistory: [1, 1, 0, 1, 0, 0] },
        deps,
      ).kind,
    ).toBe("habit");
  });
});

describe("engine orchestration + selectors", () => {
  const predictions = runPredictionEngine(
    {
      goals: [
        { id: "g1", label: "Ship", progress: 40, progressHistory: [3, 3], daysRemaining: 10 },
      ],
      deadlines: [
        { id: "t1", label: "Essay", remainingTasks: 18, completionVelocity: 2.4, availableDays: 5 },
      ],
      schedule: { bookedMinutesByDay: [200, 150, 100], dayCapacityMinutes: 480 },
      workload: { workloadHistory: [80, 85, 90], readinessHistory: [60, 50, 40] },
    },
    deps,
  );
  it("runs every applicable model", () => {
    expect(predictions.length).toBe(4);
    const counts = forecastCounts(predictions);
    expect(counts.total).toBe(4);
    expect(counts.risks + counts.opportunities + counts.onTrack).toBeLessThanOrEqual(4);
  });
  it("selects risk + opportunity forecasts, sorted by confidence", () => {
    const risks = riskForecasts(predictions);
    expect(risks.some((p) => p.kind === "deadline")).toBe(true);
    const opps = opportunityForecasts(predictions);
    expect(opps.every((p) => p.outlook === "opportunity")).toBe(true);
    expect(chiefForecasts(predictions).length).toBeGreaterThan(0);
  });
});

describe("prediction → signal bridge", () => {
  it("bridges actionable forecasts into 6.1 Signals carrying confidence; skips on-track", () => {
    const preds = runPredictionEngine(
      {
        deadlines: [
          {
            id: "t1",
            label: "Essay",
            remainingTasks: 18,
            completionVelocity: 2.4,
            availableDays: 5,
          },
        ],
      },
      deps,
    );
    const sigs = predictionSignals(preds, deps);
    expect(sigs.length).toBe(1);
    expect(sigs[0]!.category).toBe("risks");
    expect(sigs[0]!.explanation.headline).toContain("Forecast:");
    expect(sigs[0]!.confidence).toBeGreaterThan(0);
    expect(sigs[0]!.eventIds).toEqual([]);
  });
});

describe("scenario simulation — no mutation", () => {
  it("projects the effect of a hypothetical change", () => {
    const p = forecastGoal(
      { id: "g1", label: "Ship", progress: 40, progressHistory: [3, 3], daysRemaining: 10 },
      deps,
    );
    const before = { ...p };
    const sim = simulateScenario(p, { kind: "add_focus_block", amount: 60 });
    expect(sim.effects.length).toBeGreaterThan(0);
    expect(typeof sim.netDelta).toBe("number");
    // baseline prediction is unchanged (immutable)
    expect(p).toEqual(before);
  });
});

describe("prediction timeline", () => {
  it("orders now + forecast points chronologically", () => {
    const preds = runPredictionEngine(
      {
        deadlines: [
          {
            id: "t1",
            label: "Essay",
            remainingTasks: 18,
            completionVelocity: 2.4,
            availableDays: 5,
          },
        ],
      },
      deps,
    );
    const tl = buildPredictionTimeline(preds, now);
    expect(tl[0]!.when).toBe("current");
    expect(tl.length).toBeGreaterThan(1);
    const times = tl.map((p) => p.at);
    expect([...times].sort()).toEqual(times);
  });
});
