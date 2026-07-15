import { describe, expect, it } from "vitest";
import { allocateTasks, type AllocationContext } from "./allocator";
import { DATE, at, makeBlockFixture, makeTask } from "./fixtures";

function ctx(
  now: Date,
  fixedBlocks = [] as ReturnType<typeof makeBlockFixture>[],
): AllocationContext {
  return {
    date: DATE,
    now,
    workingStart: at(9),
    workingEnd: at(18),
    fixedBlocks,
    nowIso: now.toISOString(),
  };
}

const hourOf = (iso: string) => new Date(iso).getHours();

describe("allocateTasks", () => {
  it("places tasks back-to-back from the start of the window", () => {
    const blocks = allocateTasks([makeTask({ id: "a" }), makeTask({ id: "b" })], ctx(at(9)));
    expect(blocks.map((b) => hourOf(b.startTime))).toEqual([9, 10]);
    expect(blocks.every((b) => b.type === "task")).toBe(true);
  });

  it("weaves around a fixed block", () => {
    const meeting = makeBlockFixture({
      id: "m",
      type: "meeting",
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    const blocks = allocateTasks(
      [makeTask({ id: "a" }), makeTask({ id: "b" })],
      ctx(at(9), [meeting]),
    );
    expect(hourOf(blocks[0]!.startTime)).toBe(9);
    expect(hourOf(blocks[1]!.startTime)).toBe(11);
  });

  it("marks work past the window as overflow", () => {
    const blocks = allocateTasks([makeTask({ id: "a", estimatedMinutes: 60 })], ctx(at(17, 30)));
    expect(blocks[0]!.type).toBe("overflow");
  });

  it("uses the default estimate when a task has none", () => {
    const blocks = allocateTasks([makeTask({ id: "a", estimatedMinutes: null })], ctx(at(9)));
    expect(new Date(blocks[0]!.endTime).getMinutes()).toBe(30);
  });

  it("returns nothing for no tasks", () => {
    expect(allocateTasks([], ctx(at(9)))).toEqual([]);
  });

  it("carries the task id and title onto the block", () => {
    const blocks = allocateTasks([makeTask({ id: "x", title: "Research" })], ctx(at(9)));
    expect(blocks[0]!.taskId).toBe("x");
    expect(blocks[0]!.title).toBe("Research");
    expect(blocks[0]!.source).toBe("task");
  });

  it("never overlaps allocated blocks with each other", () => {
    const blocks = allocateTasks(
      [makeTask({ id: "a" }), makeTask({ id: "b" }), makeTask({ id: "c" })],
      ctx(at(9)),
    );
    for (let i = 1; i < blocks.length; i++) {
      expect(new Date(blocks[i]!.startTime).getTime()).toBeGreaterThanOrEqual(
        new Date(blocks[i - 1]!.endTime).getTime(),
      );
    }
  });

  it("starts at the window open when now precedes working hours", () => {
    const blocks = allocateTasks([makeTask({ id: "a" })], ctx(at(7)));
    expect(hourOf(blocks[0]!.startTime)).toBe(9);
  });
});
