import { describe, expect, it } from "vitest";
import { assessWorkload, type WorkloadTask } from "./workload";

const tasks = (mins: number[]): WorkloadTask[] =>
  mins.map((m, i) => ({ id: `t${i}`, title: `Task ${i}`, priorityWeight: i, estimateMinutes: m }));

describe("assessWorkload", () => {
  it("flags an overloaded day and proposes lowest-priority deferrals", () => {
    const r = assessWorkload({
      tasks: tasks([60, 60, 60, 60, 60, 60, 60]), // 420m planned
      availableMinutes: 480,
      meetingMinutes: 180,
      completionRate: 0.6,
      completionSampleDays: 30,
      estimateAdjustment: 1,
    });
    // free = 300, realistic = 180, expected = 420 → overloaded.
    expect(r.overloaded).toBe(true);
    expect(r.overBy).toBeGreaterThan(0);
    expect(r.deferSuggestions.length).toBeGreaterThan(0);
    // Lowest priorityWeight (t0) is deferred first.
    expect(r.deferSuggestions[0]?.id).toBe("t0");
    expect(r.headline).toMatch(/overloaded/);
    expect(r.reasons.some((x) => x.includes("60%"))).toBe(true);
  });

  it("calls a light day realistic and defers nothing", () => {
    const r = assessWorkload({
      tasks: tasks([30, 30]),
      availableMinutes: 480,
      meetingMinutes: 0,
      completionRate: 0.8,
      completionSampleDays: 20,
      estimateAdjustment: 1,
    });
    expect(r.overloaded).toBe(false);
    expect(r.deferSuggestions).toHaveLength(0);
    expect(r.headline).toMatch(/realistic/);
  });

  it("applies the learned estimation bias to expected load", () => {
    const r = assessWorkload({
      tasks: tasks([60, 60]), // 120 planned
      availableMinutes: 200,
      meetingMinutes: 0,
      completionRate: 1,
      completionSampleDays: 30,
      estimateAdjustment: 1.5, // tasks run 50% longer
    });
    expect(r.expectedMinutes).toBe(180);
    expect(r.reasons.some((x) => x.includes("expected"))).toBe(true);
  });

  it("falls back to raw capacity + low confidence when history is unknown", () => {
    const r = assessWorkload({
      tasks: tasks([60]),
      availableMinutes: 480,
      meetingMinutes: 0,
      completionRate: null,
      completionSampleDays: 0,
      estimateAdjustment: 1,
    });
    expect(r.realisticCapacityMinutes).toBe(r.freeMinutes);
    expect(r.confidence.level).toBe("low");
    expect(r.confidence.reasons[0]).toMatch(/not enough completion history/);
  });

  it("handles an empty plan honestly", () => {
    const r = assessWorkload({
      tasks: [],
      availableMinutes: 480,
      meetingMinutes: 0,
      completionRate: 0.6,
      completionSampleDays: 30,
      estimateAdjustment: 1,
    });
    expect(r.overloaded).toBe(false);
    expect(r.headline).toBe("Nothing planned yet");
  });
});
