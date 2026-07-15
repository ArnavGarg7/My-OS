import { describe, expect, it } from "vitest";
import {
  currentBlock,
  nextTaskBlock,
  remainingWork,
  taskBlocks,
  upcomingBlock,
  utilization,
} from "./selectors";
import { at, makeBlockFixture, makeDay } from "./fixtures";

const blocks = [
  makeBlockFixture({
    id: "past",
    taskId: "p",
    type: "task",
    startTime: at(9).toISOString(),
    endTime: at(10).toISOString(),
  }),
  makeBlockFixture({
    id: "now",
    taskId: "n",
    type: "task",
    startTime: at(10).toISOString(),
    endTime: at(11).toISOString(),
  }),
  makeBlockFixture({
    id: "next",
    taskId: "x",
    type: "task",
    startTime: at(11).toISOString(),
    endTime: at(12).toISOString(),
  }),
];

describe("currentBlock", () => {
  it("returns the block containing now", () => {
    expect(currentBlock(blocks, at(10, 30))?.id).toBe("now");
  });
  it("returns null when nothing is active", () => {
    expect(currentBlock(blocks, at(13))).toBeNull();
  });
});

describe("upcomingBlock / nextTaskBlock", () => {
  it("returns the next block after now", () => {
    expect(upcomingBlock(blocks, at(10, 30))?.id).toBe("next");
  });
  it("returns the next task-backed block", () => {
    expect(nextTaskBlock(blocks, at(10, 30))?.id).toBe("next");
  });
});

describe("remainingWork", () => {
  it("sums unfinished task-block minutes after now", () => {
    // 'now' (10–11) and 'next' (11–12) both end after 10:30 → 60 + 60 = 120
    expect(remainingWork(blocks, at(10, 30))).toBe(120);
  });
});

describe("utilization", () => {
  it("computes scheduled / free / percent", () => {
    const day = makeDay({ workingStart: "09:00", workingEnd: "18:00" }); // 540 min
    const u = utilization(day, blocks); // 3 × 60 = 180
    expect(u.scheduledMinutes).toBe(180);
    expect(u.workingMinutes).toBe(540);
    expect(u.freeMinutes).toBe(360);
    expect(u.percentUtilized).toBe(33);
  });
});

describe("taskBlocks", () => {
  it("returns only task-backed blocks, sorted", () => {
    const withBreak = [...blocks, makeBlockFixture({ id: "lunch", taskId: null, type: "break" })];
    expect(taskBlocks(withBreak).map((b) => b.id)).toEqual(["past", "now", "next"]);
  });
});

describe("currentBlock preference", () => {
  it("prefers a work block over an overlapping break", () => {
    const brk = makeBlockFixture({
      id: "brk",
      type: "break",
      taskId: null,
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    const work = makeBlockFixture({
      id: "work",
      type: "task",
      taskId: "w",
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    expect(currentBlock([brk, work], at(10, 30))?.id).toBe("work");
  });
});

describe("utilization edge cases", () => {
  it("is 0% for an empty day", () => {
    const u = utilization(makeDay(), []);
    expect(u.percentUtilized).toBe(0);
    expect(u.freeMinutes).toBe(540);
  });
});
