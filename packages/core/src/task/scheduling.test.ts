import { describe, expect, it } from "vitest";
import { scheduleTask } from "./scheduling";
import { WH, at, makeTask } from "./fixtures";

const hourOf = (iso: string | null) => (iso ? new Date(iso).getHours() : null);

describe("scheduleTask", () => {
  it("recommends the current time when inside the window and free", () => {
    const task = makeTask({ estimatedMinutes: 60 });
    const r = scheduleTask({ task, workingHours: WH, existing: [], now: at(10) });
    expect(hourOf(r.recommendedStart)).toBe(10);
    expect(hourOf(r.recommendedEnd)).toBe(11);
    expect(r.overflow).toBe(false);
    expect(r.remainingWork).toBe(0);
  });

  it("starts at the window open when now is before working hours", () => {
    const task = makeTask({ estimatedMinutes: 60 });
    const r = scheduleTask({ task, workingHours: WH, existing: [], now: at(7) });
    expect(hourOf(r.recommendedStart)).toBe(9);
  });

  it("skips past a busy block to the next free slot", () => {
    const busy = makeTask({
      id: "b",
      scheduledStart: at(10).toISOString(),
      scheduledEnd: at(11).toISOString(),
    });
    const task = makeTask({ estimatedMinutes: 60 });
    const r = scheduleTask({ task, workingHours: WH, existing: [busy], now: at(10) });
    expect(hourOf(r.recommendedStart)).toBe(11);
  });

  it("uses a gap before a later block when it fits", () => {
    const busy = makeTask({
      id: "b",
      scheduledStart: at(15).toISOString(),
      scheduledEnd: at(16).toISOString(),
    });
    const task = makeTask({ estimatedMinutes: 60 });
    const r = scheduleTask({ task, workingHours: WH, existing: [busy], now: at(10) });
    expect(hourOf(r.recommendedStart)).toBe(10);
  });

  it("flags overflow when the task can't finish before the window closes", () => {
    const task = makeTask({ estimatedMinutes: 120 });
    const r = scheduleTask({ task, workingHours: WH, existing: [], now: at(17) });
    expect(r.overflow).toBe(true);
    expect(r.remainingWork).toBe(60); // 17:00 + 120m = 19:00, window ends 18:00
  });

  it("returns no slot with full remaining work when the window is over", () => {
    const task = makeTask({ estimatedMinutes: 30 });
    const r = scheduleTask({ task, workingHours: WH, existing: [], now: at(19) });
    expect(r.recommendedStart).toBeNull();
    expect(r.overflow).toBe(true);
    expect(r.remainingWork).toBe(30);
  });

  it("falls back to a default estimate when the task has none", () => {
    const task = makeTask({ estimatedMinutes: null });
    const r = scheduleTask({ task, workingHours: WH, existing: [], now: at(10) });
    // default 30 minutes
    expect(new Date(r.recommendedEnd!).getMinutes()).toBe(30);
  });
});
