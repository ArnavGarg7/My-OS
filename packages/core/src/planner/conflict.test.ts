import { describe, expect, it } from "vitest";
import { detectConflicts } from "./conflict";
import { at, makeBlockFixture, makeTask } from "./fixtures";
import { dep } from "../task/fixtures";

const base = {
  workingStart: at(9),
  workingEnd: at(18),
  now: at(9),
};

describe("detectConflicts", () => {
  it("reports no conflicts for a clean plan", () => {
    const blocks = [
      makeBlockFixture({
        id: "a",
        taskId: "a",
        startTime: at(9).toISOString(),
        endTime: at(10).toISOString(),
      }),
    ];
    const conflicts = detectConflicts({
      blocks,
      tasks: [makeTask({ id: "a" })],
      dependencies: [],
      ...base,
    });
    expect(conflicts).toEqual([]);
  });

  it("detects overlaps", () => {
    const blocks = [
      makeBlockFixture({
        id: "a",
        startTime: at(9).toISOString(),
        endTime: at(10, 30).toISOString(),
      }),
      makeBlockFixture({ id: "b", startTime: at(10).toISOString(), endTime: at(11).toISOString() }),
    ];
    const conflicts = detectConflicts({ blocks, tasks: [], dependencies: [], ...base });
    expect(conflicts.some((c) => c.type === "overlap")).toBe(true);
  });

  it("detects an impossible task longer than the working day", () => {
    const task = makeTask({ id: "a", estimatedMinutes: 10 * 60 });
    const conflicts = detectConflicts({ blocks: [], tasks: [task], dependencies: [], ...base });
    expect(conflicts.some((c) => c.type === "impossible")).toBe(true);
  });

  it("detects a dependency violation", () => {
    const blocks = [
      makeBlockFixture({
        id: "impl",
        taskId: "impl",
        startTime: at(9).toISOString(),
        endTime: at(10).toISOString(),
      }),
      makeBlockFixture({
        id: "design",
        taskId: "design",
        startTime: at(10).toISOString(),
        endTime: at(11).toISOString(),
      }),
    ];
    const tasks = [makeTask({ id: "impl" }), makeTask({ id: "design" })];
    const conflicts = detectConflicts({
      blocks,
      tasks,
      dependencies: [dep("impl", "design")],
      ...base,
    });
    expect(conflicts.some((c) => c.type === "dependency-violation")).toBe(true);
  });

  it("detects overdue scheduling", () => {
    const task = makeTask({ id: "a", estimatedMinutes: 60, dueAt: at(9, 30).toISOString() });
    const blocks = [
      makeBlockFixture({
        id: "a",
        taskId: "a",
        startTime: at(9).toISOString(),
        endTime: at(10).toISOString(),
      }),
    ];
    const conflicts = detectConflicts({ blocks, tasks: [task], dependencies: [], ...base });
    expect(conflicts.some((c) => c.type === "overdue")).toBe(true);
  });

  it("detects insufficient hours", () => {
    // 9:00 now, window ends 18:00 → 540 min available; ask for 600.
    const tasks = [
      makeTask({ id: "a", estimatedMinutes: 300 }),
      makeTask({ id: "b", estimatedMinutes: 300 }),
    ];
    const conflicts = detectConflicts({ blocks: [], tasks, dependencies: [], ...base });
    expect(conflicts.some((c) => c.type === "insufficient-hours")).toBe(true);
  });

  it("does not flag touching (non-overlapping) blocks", () => {
    const blocks = [
      makeBlockFixture({ id: "a", startTime: at(9).toISOString(), endTime: at(10).toISOString() }),
      makeBlockFixture({ id: "b", startTime: at(10).toISOString(), endTime: at(11).toISOString() }),
    ];
    const conflicts = detectConflicts({ blocks, tasks: [], dependencies: [], ...base });
    expect(conflicts.some((c) => c.type === "overlap")).toBe(false);
  });

  it("accepts a dependency scheduled in the correct order", () => {
    const blocks = [
      makeBlockFixture({
        id: "design",
        taskId: "design",
        startTime: at(9).toISOString(),
        endTime: at(10).toISOString(),
      }),
      makeBlockFixture({
        id: "impl",
        taskId: "impl",
        startTime: at(10).toISOString(),
        endTime: at(11).toISOString(),
      }),
    ];
    const tasks = [
      makeTask({ id: "impl", estimatedMinutes: 60 }),
      makeTask({ id: "design", estimatedMinutes: 60 }),
    ];
    const conflicts = detectConflicts({
      blocks,
      tasks,
      dependencies: [dep("impl", "design")],
      ...base,
    });
    expect(conflicts.some((c) => c.type === "dependency-violation")).toBe(false);
  });

  it("returns multiple conflicts when several problems exist", () => {
    const blocks = [
      makeBlockFixture({
        id: "a",
        startTime: at(9).toISOString(),
        endTime: at(10, 30).toISOString(),
      }),
      makeBlockFixture({ id: "b", startTime: at(10).toISOString(), endTime: at(11).toISOString() }),
    ];
    const tasks = [makeTask({ id: "big", estimatedMinutes: 700 })];
    const conflicts = detectConflicts({ blocks, tasks, dependencies: [], ...base });
    expect(conflicts.length).toBeGreaterThanOrEqual(2);
  });
});
