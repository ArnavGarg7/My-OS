import { describe, expect, it } from "vitest";
import { at, day, makeGoal, makeKeyResult, makeObjective } from "./fixtures";
import { forecastGoal } from "./forecasting";

const now = new Date(at(2026, 6, 1)); // Jul 1

function goalAt(progressPercent: number, over = {}) {
  return makeGoal({
    startedAt: at(2026, 5, 1), // Jun 1 → 30 days elapsed
    objectives: [
      makeObjective({
        keyResults: [makeKeyResult({ metricType: "percentage", currentValue: progressPercent })],
      }),
    ],
    ...over,
  });
}

describe("forecasting", () => {
  it("computes velocity from progress over elapsed days", () => {
    const f = forecastGoal(goalAt(60), now);
    expect(f.velocityPerDay).toBeCloseTo(2, 1); // 60% / 30 days
  });

  it("estimates a completion date", () => {
    const f = forecastGoal(goalAt(50), now);
    expect(f.estimatedCompletion).not.toBeNull();
  });

  it("marks a fast goal ahead of schedule", () => {
    const f = forecastGoal(goalAt(90, { targetDate: day(2026, 11, 31) }), now);
    expect(f.status).toBe("ahead");
  });

  it("marks a slow goal behind schedule", () => {
    const f = forecastGoal(goalAt(5, { targetDate: day(2026, 7, 1) }), now);
    expect(f.status).toBe("behind");
  });

  it("returns unknown status without a target date", () => {
    expect(forecastGoal(goalAt(50, { targetDate: null }), now).status).toBe("unknown");
  });

  it("reports on_track for a completed goal", () => {
    const f = forecastGoal(
      makeGoal({ status: "completed", targetDate: day(2026, 11, 31), startedAt: at(2026, 5, 1) }),
      now,
    );
    expect(f.status).toBe("on_track");
  });
});
