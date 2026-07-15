import { describe, expect, it } from "vitest";
import { computeFocus, computeProductivity } from "./productivity";
import { at, ev, makeEvents } from "./fixtures";

describe("computeProductivity", () => {
  it("tallies tasks, deep work + decisions", () => {
    const p = computeProductivity(makeEvents());
    expect(p.tasksCompleted).toBe(2);
    expect(p.tasksCreated).toBe(1);
    expect(p.deepWorkMinutes).toBe(180);
    expect(p.decisionsCompleted).toBe(1);
    expect(p.score).toBeGreaterThan(0);
    expect(p.score).toBeLessThanOrEqual(100);
  });
  it("uses planner accuracy when supplied", () => {
    const p = computeProductivity(makeEvents(), {
      accuracy: 90,
      blocksCompleted: 9,
      blocksTotal: 10,
      regenerations: 0,
      lockedBlocks: 1,
      overflow: 0,
      utilization: 80,
    });
    expect(p.plannerCompletion).toBe(90);
  });
  it("penalises heavy context switching", () => {
    const clean = computeProductivity([
      ev({ eventType: "task.completed", metadata: { focusMinutes: 240 } }),
    ]);
    const noisy = computeProductivity([
      ev({ eventType: "task.completed", metadata: { focusMinutes: 240, contextSwitches: 20 } }),
    ]);
    expect(noisy.score).toBeLessThan(clean.score);
  });
  it("is zero with no activity", () => {
    expect(computeProductivity([]).score).toBe(0);
  });

  it("counts focus blocks from metadata", () => {
    const p = computeProductivity([
      ev({ metadata: { focusMinutes: 30 } }),
      ev({ metadata: { focusMinutes: 40 } }),
      ev({ eventType: "task.created" }),
    ]);
    expect(p.focusBlocks).toBe(2);
  });

  it("averages execution time from metadata", () => {
    const p = computeProductivity([
      ev({ metadata: { executionMinutes: 20 } }),
      ev({ metadata: { executionMinutes: 40 } }),
    ]);
    expect(p.avgExecutionMinutes).toBe(30);
  });

  it("rewards more completed tasks", () => {
    const few = computeProductivity([ev({ eventType: "task.completed" })]);
    const many = computeProductivity([
      ev({ eventType: "task.completed" }),
      ev({ eventType: "task.completed" }),
      ev({ eventType: "task.completed" }),
    ]);
    expect(many.tasksCompleted).toBeGreaterThan(few.tasksCompleted);
  });
});

describe("computeFocus", () => {
  it("computes deep work, blocks + longest block", () => {
    const f = computeFocus([
      ev({ metadata: { focusMinutes: 90 }, timestamp: at(2026, 6, 6, 9) }),
      ev({ metadata: { focusMinutes: 150 }, timestamp: at(2026, 6, 6, 11) }),
    ]);
    expect(f.deepWorkMinutes).toBe(240);
    expect(f.focusBlocks).toBe(2);
    expect(f.longestBlockMinutes).toBe(150);
    expect(f.score).toBeGreaterThan(0);
  });
  it("drops continuity with context switches", () => {
    const calm = computeFocus([ev({ metadata: { focusMinutes: 240 } })]);
    const jumpy = computeFocus([ev({ metadata: { focusMinutes: 240, contextSwitches: 15 } })]);
    expect(jumpy.score).toBeLessThan(calm.score);
  });
  it("is zero with no focus blocks", () => {
    expect(computeFocus([ev({ eventType: "task.created" })]).score).toBe(0);
  });
});
