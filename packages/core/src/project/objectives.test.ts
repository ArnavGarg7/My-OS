import { describe, expect, it } from "vitest";
import { makeObjective } from "./fixtures";
import {
  missedObjectives,
  objectiveProgress,
  objectivesAverage,
  updateObjective,
} from "./objectives";

describe("objectives", () => {
  it("returns 100% when completed", () => {
    expect(objectiveProgress(makeObjective({ completed: true }))).toBe(100);
  });

  it("computes percent from current/target", () => {
    expect(objectiveProgress(makeObjective({ currentValue: 3, targetValue: 12 }))).toBe(25);
  });

  it("clamps percent to 100", () => {
    expect(objectiveProgress(makeObjective({ currentValue: 20, targetValue: 10 }))).toBe(100);
  });

  it("returns 0 for a non-positive target", () => {
    expect(objectiveProgress(makeObjective({ targetValue: 0, currentValue: 5 }))).toBe(0);
  });

  it("updates current value and auto-completes at target", () => {
    const next = updateObjective(makeObjective({ targetValue: 10 }), 10);
    expect(next.currentValue).toBe(10);
    expect(next.completed).toBe(true);
  });

  it("does not complete below the target", () => {
    const next = updateObjective(makeObjective({ targetValue: 10 }), 4);
    expect(next.completed).toBe(false);
  });

  it("floors negative updates at zero", () => {
    expect(updateObjective(makeObjective(), -5).currentValue).toBe(0);
  });

  it("averages objective progress", () => {
    const objs = [
      makeObjective({ id: "a", currentValue: 10, targetValue: 10 }),
      makeObjective({ id: "b", currentValue: 0, targetValue: 10 }),
    ];
    expect(objectivesAverage(objs)).toBe(50);
  });

  it("returns 0 average for no objectives", () => {
    expect(objectivesAverage([])).toBe(0);
  });

  it("flags objectives that are behind (<50%)", () => {
    const objs = [
      makeObjective({ id: "behind", currentValue: 1, targetValue: 10 }),
      makeObjective({ id: "ok", currentValue: 8, targetValue: 10 }),
    ];
    expect(missedObjectives(objs).map((o) => o.id)).toEqual(["behind"]);
  });

  it("completes exactly at the target boundary", () => {
    expect(updateObjective(makeObjective({ targetValue: 5 }), 5).completed).toBe(true);
  });

  it("does not flag a completed objective as missed", () => {
    const objs = [makeObjective({ id: "done", completed: true, currentValue: 0, targetValue: 10 })];
    expect(missedObjectives(objs)).toEqual([]);
  });
});
