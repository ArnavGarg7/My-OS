import { describe, expect, it } from "vitest";
import { computeFreeBusy, hasDeepWorkWindow } from "./freebusy";
import { iso } from "./fixtures";
import type { Interval } from "./types";

function interval(type: Interval["type"], startH: number, endH: number): Interval {
  return { start: iso(startH), end: iso(endH), type, label: type };
}

const day: Interval[] = [
  interval("available", 9, 12), // 180 free
  interval("meeting", 12, 13), // 60 busy
  interval("focus", 13, 15), // 120 free
  interval("available", 15, 18), // 180 free
];

describe("computeFreeBusy", () => {
  it("splits busy vs free minutes", () => {
    const fb = computeFreeBusy(day);
    expect(fb.freeMinutes).toBe(480);
    expect(fb.busyMinutes).toBe(60);
  });

  it("tallies meeting and focus minutes", () => {
    const fb = computeFreeBusy(day);
    expect(fb.meetingMinutes).toBe(60);
    expect(fb.focusMinutes).toBe(120);
  });

  it("computes busy/free percentages", () => {
    const fb = computeFreeBusy(day);
    expect(fb.busyPercent).toBe(11); // 60 / 540
    expect(fb.freePercent).toBe(89);
  });

  it("finds the longest free slot", () => {
    const fb = computeFreeBusy(day);
    expect(fb.longestFreeSlot?.minutes).toBe(180);
  });

  it("finds the next free window from now", () => {
    const fb = computeFreeBusy(day, new Date(iso(12, 30)));
    // during the meeting → next free is the 13:00 focus block
    expect(new Date(fb.nextFreeWindow!.start).getHours()).toBe(13);
  });

  it("is all-free with no busy intervals", () => {
    const fb = computeFreeBusy([interval("available", 9, 17)]);
    expect(fb.busyPercent).toBe(0);
    expect(fb.freePercent).toBe(100);
  });

  it("returns nulls for an empty day", () => {
    const fb = computeFreeBusy([]);
    expect(fb.longestFreeSlot).toBeNull();
    expect(fb.busyPercent).toBe(0);
  });

  it("counts personal minutes separately", () => {
    const fb = computeFreeBusy([interval("personal", 18, 22)]);
    expect(fb.personalMinutes).toBe(240);
  });
});

describe("hasDeepWorkWindow", () => {
  it("is true when a free slot is at least 90 minutes", () => {
    expect(hasDeepWorkWindow(day)).toBe(true);
  });
  it("is false when free slots are all shorter than 90 minutes", () => {
    expect(hasDeepWorkWindow([interval("available", 9, 10)])).toBe(false); // 60 min
    expect(hasDeepWorkWindow([interval("meeting", 9, 12)])).toBe(false); // busy, not free
  });
});
