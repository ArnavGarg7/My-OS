import { describe, expect, it } from "vitest";
import { computeHealth } from "./health";

describe("computeHealth", () => {
  it("scores a strong week highly", () => {
    const m = computeHealth({
      avgReadiness: 85,
      avgSleepMinutes: 450,
      avgHydrationPercent: 100,
      recoveryScore: 90,
      workoutCount: 4,
    });
    expect(m.score).toBeGreaterThanOrEqual(85);
    expect(m.workoutConsistency).toBe(100);
  });
  it("penalises poor sleep + low readiness", () => {
    const m = computeHealth({
      avgReadiness: 40,
      avgSleepMinutes: 300,
      avgHydrationPercent: 50,
      recoveryScore: 40,
      workoutCount: 0,
    });
    expect(m.score).toBeLessThan(60);
    expect(m.workoutConsistency).toBe(0);
  });
  it("honours a custom workout target", () => {
    const m = computeHealth({
      avgReadiness: 80,
      avgSleepMinutes: 450,
      avgHydrationPercent: 100,
      recoveryScore: 80,
      workoutCount: 2,
      workoutTargetPerWeek: 2,
    });
    expect(m.workoutConsistency).toBe(100);
  });
  it("defaults to zero without input", () => {
    expect(computeHealth().score).toBe(0);
  });

  it("rounds displayed averages", () => {
    const m = computeHealth({
      avgReadiness: 82.6,
      avgSleepMinutes: 441.4,
      avgHydrationPercent: 88.9,
      recoveryScore: 77.2,
      workoutCount: 3,
    });
    expect(m.avgReadiness).toBe(83);
    expect(m.avgSleepMinutes).toBe(441);
    expect(m.avgHydrationPercent).toBe(89);
  });

  it("caps workout consistency at 100 when exceeding target", () => {
    const m = computeHealth({
      avgReadiness: 80,
      avgSleepMinutes: 450,
      avgHydrationPercent: 100,
      recoveryScore: 80,
      workoutCount: 8,
    });
    expect(m.workoutConsistency).toBe(100);
  });
});
