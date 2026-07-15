import { describe, expect, it } from "vitest";
import type { WorkingHours } from "./constants";
import {
  calculateDayProgress,
  calculateEnergyTrend,
  calculateFocusScore,
  calculateNextCheckpoint,
  calculateProductiveWindow,
  calculateRemainingDay,
  getDayPhase,
  minutesOfDay,
  minutesToTime,
  planToday,
  timeToMinutes,
  todayInTimeZone,
} from "./planner";

const WH: WorkingHours = { start: "09:00", end: "18:00" }; // 540 → 1080 (540 min)
const at = (h: number, m = 0) => new Date(2026, 6, 6, h, m, 0);

describe("time helpers", () => {
  it("timeToMinutes / minutesToTime round-trip", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(0)).toBe("00:00");
  });
  it("clamps garbage to 0", () => {
    expect(timeToMinutes("nonsense")).toBe(0);
  });
  it("minutesOfDay reads local hours/minutes", () => {
    expect(minutesOfDay(at(10, 15))).toBe(615);
  });
});

describe("todayInTimeZone", () => {
  it("resolves the local calendar date per zone", () => {
    const instant = new Date("2026-07-06T02:00:00Z");
    expect(todayInTimeZone("Asia/Kolkata", instant)).toBe("2026-07-06");
    expect(todayInTimeZone("America/Los_Angeles", instant)).toBe("2026-07-05");
  });
});

describe("getDayPhase", () => {
  it("buckets the clock into phases", () => {
    expect(getDayPhase(at(8))).toBe("morning");
    expect(getDayPhase(at(14))).toBe("afternoon");
    expect(getDayPhase(at(19))).toBe("evening");
    expect(getDayPhase(at(23))).toBe("night");
  });
});

describe("calculateRemainingDay", () => {
  it("before working hours → full day remaining", () => {
    const r = calculateRemainingDay(at(8), WH);
    expect(r.elapsedMinutes).toBe(0);
    expect(r.remainingMinutes).toBe(540);
    expect(r.percentRemaining).toBe(100);
  });
  it("within working hours", () => {
    const r = calculateRemainingDay(at(10), WH);
    expect(r.elapsedMinutes).toBe(60);
    expect(r.remainingMinutes).toBe(480);
    expect(r.percentRemaining).toBe(89);
  });
  it("after working hours → nothing remaining", () => {
    const r = calculateRemainingDay(at(19), WH);
    expect(r.remainingMinutes).toBe(0);
    expect(r.percentRemaining).toBe(0);
  });
});

describe("calculateDayProgress", () => {
  it("reports percent elapsed + phase", () => {
    const p = calculateDayProgress(at(10), WH);
    expect(p.percent).toBe(11);
    expect(p.phase).toBe("morning");
  });
});

describe("calculateProductiveWindow", () => {
  it("is active inside working hours and clamps within them", () => {
    const w = calculateProductiveWindow(at(10), WH, 90);
    expect(w.active).toBe(true);
    expect(w.start).toBe("10:00");
    expect(w.end).toBe("11:30");
    expect(w.minutes).toBe(90);
  });
  it("is inactive before working hours (window at start)", () => {
    const w = calculateProductiveWindow(at(7), WH, 90);
    expect(w.active).toBe(false);
    expect(w.start).toBe("09:00");
  });
  it("never exceeds the end of the working day", () => {
    const w = calculateProductiveWindow(at(17, 30), WH, 90);
    expect(w.end).toBe("18:00");
  });
});

describe("calculateNextCheckpoint", () => {
  it("returns the next upcoming checkpoint", () => {
    const c = calculateNextCheckpoint(at(10), WH);
    expect(c?.label).toBe("Midday");
    expect(c?.minutesUntil).toBe(210);
  });
  it("returns null after the working day", () => {
    expect(calculateNextCheckpoint(at(19), WH)).toBeNull();
  });
});

describe("calculateFocusScore", () => {
  const base = { deepWorkMinutes: 0, completedTasks: 0, interruptions: 0, focusSwitches: 0 };
  it("is the base with no activity", () => {
    expect(calculateFocusScore(base)).toBe(40);
  });
  it("maxes at 100 with full deep work + tasks", () => {
    expect(calculateFocusScore({ ...base, deepWorkMinutes: 120, completedTasks: 8 })).toBe(100);
  });
  it("floors at 0 under heavy interruptions", () => {
    expect(calculateFocusScore({ ...base, interruptions: 40 })).toBe(0);
  });
  it("mixes rewards and penalties deterministically", () => {
    expect(
      calculateFocusScore({
        deepWorkMinutes: 60,
        completedTasks: 4,
        interruptions: 2,
        focusSwitches: 3,
      }),
    ).toBe(58);
  });
});

describe("calculateEnergyTrend", () => {
  it("handles no entries", () => {
    expect(calculateEnergyTrend([])).toEqual({
      trend: "flat",
      average: 0,
      latest: null,
      samples: 0,
    });
  });
  it("detects a rising trend", () => {
    const t = calculateEnergyTrend([
      { at: "a", level: "low" },
      { at: "b", level: "high" },
    ]);
    expect(t.trend).toBe("up");
    expect(t.latest).toBe("high");
    expect(t.average).toBe(2);
    expect(t.samples).toBe(2);
  });
  it("detects a falling trend", () => {
    expect(
      calculateEnergyTrend([
        { at: "a", level: "high" },
        { at: "b", level: "low" },
      ]).trend,
    ).toBe("down");
  });
  it("is flat when unchanged", () => {
    expect(
      calculateEnergyTrend([
        { at: "a", level: "medium" },
        { at: "b", level: "medium" },
      ]).trend,
    ).toBe("flat");
  });
});

describe("planToday", () => {
  it("assembles a deterministic snapshot", () => {
    const snap = planToday({ date: "2026-07-06", now: at(10), workingHours: WH });
    expect(snap.date).toBe("2026-07-06");
    expect(snap.phase).toBe("morning");
    expect(snap.remainingDay.remainingMinutes).toBe(480);
    expect(snap.productiveWindow.active).toBe(true);
    expect(snap.nextCheckpoint?.label).toBe("Midday");
  });
});
