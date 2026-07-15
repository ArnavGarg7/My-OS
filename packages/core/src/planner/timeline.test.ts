import { describe, expect, it } from "vitest";
import {
  blockMinutes,
  earliestSlot,
  findGaps,
  isFree,
  overlaps,
  scheduledMinutes,
  sortBlocks,
} from "./timeline";
import { at, makeBlockFixture } from "./fixtures";

describe("blockMinutes", () => {
  it("computes duration in minutes", () => {
    expect(
      blockMinutes(
        makeBlockFixture({ startTime: at(9).toISOString(), endTime: at(10, 30).toISOString() }),
      ),
    ).toBe(90);
  });
});

describe("overlaps", () => {
  const a = makeBlockFixture({
    id: "a",
    startTime: at(9).toISOString(),
    endTime: at(10).toISOString(),
  });
  it("detects overlap", () => {
    const b = makeBlockFixture({
      id: "b",
      startTime: at(9, 30).toISOString(),
      endTime: at(10, 30).toISOString(),
    });
    expect(overlaps(a, b)).toBe(true);
  });
  it("treats touching edges as non-overlapping", () => {
    const b = makeBlockFixture({
      id: "b",
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    expect(overlaps(a, b)).toBe(false);
  });
});

describe("sortBlocks", () => {
  it("orders by start time", () => {
    const late = makeBlockFixture({
      id: "late",
      startTime: at(14).toISOString(),
      endTime: at(15).toISOString(),
    });
    const early = makeBlockFixture({
      id: "early",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    expect(sortBlocks([late, early]).map((b) => b.id)).toEqual(["early", "late"]);
  });
});

describe("scheduledMinutes", () => {
  it("sums non-overflow blocks", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const over = makeBlockFixture({
      id: "o",
      type: "overflow",
      startTime: at(18).toISOString(),
      endTime: at(19).toISOString(),
    });
    expect(scheduledMinutes([a, over])).toBe(60);
  });
});

describe("findGaps", () => {
  it("finds gaps between blocks and to the window end", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const gaps = findGaps([a], at(9).getTime(), at(12).getTime());
    expect(gaps).toHaveLength(1);
    expect(gaps[0]!.minutes).toBe(120);
  });
});

describe("isFree / earliestSlot", () => {
  const busy = [
    makeBlockFixture({ id: "x", startTime: at(9).toISOString(), endTime: at(10).toISOString() }),
  ];
  it("isFree is false during a busy block", () => {
    expect(isFree(at(9, 30).getTime(), 30 * 60_000, busy)).toBe(false);
    expect(isFree(at(10).getTime(), 30 * 60_000, busy)).toBe(true);
  });
  it("isFree treats an exactly-abutting slot as free", () => {
    // a slot ending exactly at the busy block's start does not overlap
    expect(isFree(at(8, 30).getTime(), 30 * 60_000, busy)).toBe(true);
  });
  it("earliestSlot skips past a conflicting block", () => {
    expect(earliestSlot(at(9).getTime(), 60 * 60_000, busy)).toBe(at(10).getTime());
  });
  it("earliestSlot uses a free earlier slot when it fits", () => {
    expect(earliestSlot(at(8).getTime(), 30 * 60_000, busy)).toBe(at(8).getTime());
  });
  it("earliestSlot steps past several consecutive busy blocks", () => {
    const two = [
      makeBlockFixture({ id: "x", startTime: at(9).toISOString(), endTime: at(10).toISOString() }),
      makeBlockFixture({ id: "y", startTime: at(10).toISOString(), endTime: at(11).toISOString() }),
    ];
    expect(earliestSlot(at(9).getTime(), 30 * 60_000, two)).toBe(at(11).getTime());
  });
});

describe("findGaps between blocks", () => {
  it("returns the gap between two blocks", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const b = makeBlockFixture({
      id: "b",
      startTime: at(11).toISOString(),
      endTime: at(12).toISOString(),
    });
    const gaps = findGaps([a, b], at(9).getTime(), at(12).getTime());
    expect(gaps).toHaveLength(1);
    expect(gaps[0]!.minutes).toBe(60);
  });
  it("returns no gaps for a full window", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(12).toISOString(),
    });
    expect(findGaps([a], at(9).getTime(), at(12).getTime())).toEqual([]);
  });
});
