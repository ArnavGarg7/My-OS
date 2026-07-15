import { describe, expect, it } from "vitest";
import { makeKeyResult, makeObjective } from "./fixtures";
import {
  analyzeObjective,
  completeObjective,
  isObjectiveComplete,
  objectiveProgress,
  weightedObjectivesProgress,
} from "./objectives";

describe("objectives", () => {
  it("averages key result progress", () => {
    const o = makeObjective({
      keyResults: [
        makeKeyResult({ id: "a", metricType: "percentage", currentValue: 100 }),
        makeKeyResult({ id: "b", metricType: "percentage", currentValue: 50 }),
      ],
    });
    expect(objectiveProgress(o)).toBe(75);
  });

  it("returns 100 when marked completed", () => {
    expect(objectiveProgress(makeObjective({ status: "completed" }))).toBe(100);
  });

  it("returns 0 without key results", () => {
    expect(objectiveProgress(makeObjective({ keyResults: [] }))).toBe(0);
  });

  it("detects completion + analyzes", () => {
    const o = makeObjective({
      keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 100 })],
    });
    expect(isObjectiveComplete(o)).toBe(true);
    expect(analyzeObjective(o).keyResults).toHaveLength(1);
  });

  it("computes weighted progress", () => {
    const objectives = [
      makeObjective({
        id: "a",
        weight: 3,
        keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 100 })],
      }),
      makeObjective({
        id: "b",
        weight: 1,
        keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 0 })],
      }),
    ];
    expect(weightedObjectivesProgress(objectives)).toBe(75);
  });

  it("falls back to a simple mean with zero weights", () => {
    const objectives = [
      makeObjective({
        id: "a",
        weight: 0,
        keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 80 })],
      }),
      makeObjective({
        id: "b",
        weight: 0,
        keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 40 })],
      }),
    ];
    expect(weightedObjectivesProgress(objectives)).toBe(60);
  });

  it("completes an objective", () => {
    expect(completeObjective(makeObjective()).status).toBe("completed");
  });
});
