import { describe, expect, it } from "vitest";
import { busyIntervals, freeBusyHeadline, findSlot, freeSlots } from "./scheduler";
import { computeFreeBusy } from "./freebusy";
import { iso } from "./fixtures";
import type { Interval } from "./types";

function interval(type: Interval["type"], startH: number, endH: number): Interval {
  return { start: iso(startH), end: iso(endH), type, label: type };
}

const day: Interval[] = [
  interval("available", 9, 12),
  interval("meeting", 12, 13),
  interval("available", 13, 18),
];

describe("findSlot", () => {
  it("finds the earliest fitting free slot from now", () => {
    const slot = findSlot(day, 60, new Date(iso(9)))!;
    expect(new Date(slot.start).getHours()).toBe(9);
    expect(new Date(slot.end).getHours()).toBe(10);
  });
  it("skips busy intervals", () => {
    const slot = findSlot(day, 60, new Date(iso(12, 30)))!;
    expect(new Date(slot.start).getHours()).toBe(13);
  });
  it("returns null when nothing fits", () => {
    expect(findSlot(day, 600, new Date(iso(17, 30)))).toBeNull();
  });
});

describe("freeSlots", () => {
  it("returns only free intervals meeting the minimum length", () => {
    expect(freeSlots(day, 120).map((i) => new Date(i.start).getHours())).toEqual([9, 13]);
  });
});

describe("busyIntervals", () => {
  it("returns meeting/busy/break intervals", () => {
    expect(busyIntervals(day)).toHaveLength(1);
    expect(busyIntervals(day)[0]!.type).toBe("meeting");
  });
});

describe("freeBusyHeadline", () => {
  it("describes the longest free window", () => {
    const fb = computeFreeBusy(day);
    expect(freeBusyHeadline(fb)).toMatch(/free .*focus window/);
  });
  it("falls back to a percentage with no free slots", () => {
    const fb = computeFreeBusy([interval("meeting", 9, 17)]);
    expect(freeBusyHeadline(fb)).toMatch(/free/);
  });
});

describe("freeSlots minimum", () => {
  it("excludes short free slots below the threshold", () => {
    const slots = freeSlots([interval("available", 9, 9), interval("available", 10, 13)], 120);
    expect(slots).toHaveLength(1);
  });
});
