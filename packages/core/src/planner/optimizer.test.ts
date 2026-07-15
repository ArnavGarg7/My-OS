import { describe, expect, it } from "vitest";
import { markFocusBlocks, mergeTinyGaps, optimizeTimeline, reserveBuffers } from "./optimizer";
import { at, makeBlockFixture } from "./fixtures";

describe("mergeTinyGaps", () => {
  it("pulls an unlocked block earlier to close a small gap", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const b = makeBlockFixture({
      id: "b",
      startTime: at(10, 10).toISOString(),
      endTime: at(10, 40).toISOString(),
    });
    const [, merged] = mergeTinyGaps([a, b]);
    expect(new Date(merged!.startTime).getHours()).toBe(10);
    expect(new Date(merged!.startTime).getMinutes()).toBe(0);
  });

  it("never moves a locked block", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const b = makeBlockFixture({
      id: "b",
      locked: true,
      startTime: at(10, 10).toISOString(),
      endTime: at(10, 40).toISOString(),
    });
    const [, keep] = mergeTinyGaps([a, b]);
    expect(new Date(keep!.startTime).getMinutes()).toBe(10);
  });

  it("leaves large gaps intact", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const b = makeBlockFixture({
      id: "b",
      startTime: at(12).toISOString(),
      endTime: at(13).toISOString(),
    });
    const [, same] = mergeTinyGaps([a, b]);
    expect(new Date(same!.startTime).getHours()).toBe(12);
  });
});

describe("markFocusBlocks", () => {
  it("marks task blocks inside the focus window as focus", () => {
    const t = makeBlockFixture({
      id: "t",
      type: "task",
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    const [marked] = markFocusBlocks([t], at(9), at(12));
    expect(marked!.type).toBe("focus");
  });

  it("leaves blocks outside the focus window unchanged", () => {
    const t = makeBlockFixture({
      id: "t",
      type: "task",
      startTime: at(14).toISOString(),
      endTime: at(15).toISOString(),
    });
    const [marked] = markFocusBlocks([t], at(9), at(12));
    expect(marked!.type).toBe("task");
  });

  it("is a no-op without a focus window", () => {
    const t = makeBlockFixture({ id: "t", type: "task" });
    expect(markFocusBlocks([t], null, null)[0]!.type).toBe("task");
  });
});

describe("reserveBuffers", () => {
  it("inserts a buffer after a meeting with a following gap", () => {
    const meeting = makeBlockFixture({
      id: "m",
      type: "meeting",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const next = makeBlockFixture({
      id: "n",
      type: "task",
      startTime: at(10, 30).toISOString(),
      endTime: at(11).toISOString(),
    });
    const result = reserveBuffers([meeting, next]);
    expect(result.some((b) => b.type === "buffer")).toBe(true);
  });

  it("does not add a buffer when the next block is immediate", () => {
    const meeting = makeBlockFixture({
      id: "m",
      type: "meeting",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const next = makeBlockFixture({
      id: "n",
      type: "task",
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    expect(reserveBuffers([meeting, next]).some((b) => b.type === "buffer")).toBe(false);
  });
});

describe("mergeTinyGaps cascade", () => {
  it("cascades shifts across several small gaps", () => {
    const a = makeBlockFixture({
      id: "a",
      startTime: at(9).toISOString(),
      endTime: at(10).toISOString(),
    });
    const b = makeBlockFixture({
      id: "b",
      startTime: at(10, 10).toISOString(),
      endTime: at(10, 40).toISOString(),
    });
    const c = makeBlockFixture({
      id: "c",
      startTime: at(10, 42).toISOString(),
      endTime: at(11, 12).toISOString(),
    });
    const merged = mergeTinyGaps([a, b, c]);
    // b → 10:00–10:30, then c's 12-min gap closes → 10:30–11:00
    expect(new Date(merged[2]!.startTime).getHours()).toBe(10);
    expect(new Date(merged[2]!.startTime).getMinutes()).toBe(30);
  });
});

describe("reserveBuffers edge cases", () => {
  it("does nothing without meetings", () => {
    const a = makeBlockFixture({ id: "a", type: "task" });
    expect(reserveBuffers([a]).some((b) => b.type === "buffer")).toBe(false);
  });
});

describe("markFocusBlocks partial", () => {
  it("does not mark a block that only partially overlaps the focus window", () => {
    const t = makeBlockFixture({
      id: "t",
      type: "task",
      startTime: at(11).toISOString(),
      endTime: at(13).toISOString(),
    });
    expect(markFocusBlocks([t], at(9), at(12))[0]!.type).toBe("task");
  });
});

describe("optimizeTimeline", () => {
  it("applies gap-merging, focus marking and buffers together", () => {
    const a = makeBlockFixture({
      id: "a",
      type: "task",
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    const result = optimizeTimeline([a], at(9), at(12));
    expect(result[0]!.type).toBe("focus");
  });

  it("never moves overflow blocks", () => {
    const over = makeBlockFixture({
      id: "o",
      type: "overflow",
      startTime: at(18).toISOString(),
      endTime: at(19).toISOString(),
    });
    const result = optimizeTimeline([over], null, null);
    expect(result[0]!.startTime).toBe(at(18).toISOString());
  });
});
