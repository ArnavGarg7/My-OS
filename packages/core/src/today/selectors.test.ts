import { describe, expect, it } from "vitest";
import {
  selectContextPanel,
  selectCurrentFocusLabel,
  selectDaySummary,
  selectHasDayStarted,
  selectWorkingHours,
} from "./selectors";
import { planToday } from "./planner";
import type { DailyFocus, DailyMetrics, DailyState } from "./types";

const state = (over: Partial<DailyState> = {}): DailyState => ({
  date: "2026-07-06",
  wakeTime: null,
  sleepTarget: null,
  energyLevel: null,
  focusScore: null,
  currentBlock: null,
  currentActivity: null,
  status: "idle",
  morningCompleted: false,
  eveningCompleted: false,
  lastRecalculatedAt: null,
  ...over,
});

const focus = (over: Partial<DailyFocus> = {}): DailyFocus => ({
  date: "2026-07-06",
  mission: null,
  blocker: null,
  priority: null,
  deepWork: null,
  quickWin: null,
  ...over,
});

describe("selectWorkingHours", () => {
  it("prefers state wake/sleep", () => {
    expect(selectWorkingHours({ state: { wakeTime: "06:30", sleepTarget: "22:00" } })).toEqual({
      start: "06:30",
      end: "22:00",
    });
  });
  it("falls back to preferences then defaults", () => {
    expect(
      selectWorkingHours({ state: null, preferredStartOfDay: "08:00", preferredEndOfDay: "20:00" }),
    ).toEqual({ start: "08:00", end: "20:00" });
    expect(selectWorkingHours({ state: null })).toEqual({ start: "09:00", end: "18:00" });
  });
});

describe("selectCurrentFocusLabel", () => {
  it("prefers current activity, then mission, then priority", () => {
    expect(
      selectCurrentFocusLabel(
        focus({ mission: "Ship 2.1" }),
        state({ currentActivity: "Deep work" }),
      ),
    ).toBe("Deep work");
    expect(selectCurrentFocusLabel(focus({ mission: "Ship 2.1" }), state())).toBe("Ship 2.1");
    expect(selectCurrentFocusLabel(focus({ priority: "Reviews" }), state())).toBe("Reviews");
    expect(selectCurrentFocusLabel(null, null)).toBeNull();
  });
});

describe("selectHasDayStarted", () => {
  it("is false with empty state + focus", () => {
    expect(selectHasDayStarted(state(), focus())).toBe(false);
    expect(selectHasDayStarted(null, null)).toBe(false);
  });
  it("is true once something is set", () => {
    expect(selectHasDayStarted(state({ wakeTime: "07:00" }), focus())).toBe(true);
    expect(selectHasDayStarted(state(), focus({ mission: "x" }))).toBe(true);
  });
});

describe("selectContextPanel", () => {
  it("derives panel values from a snapshot + metrics", () => {
    const snapshot = planToday({
      date: "2026-07-06",
      now: new Date(2026, 6, 6, 10, 0, 0),
      workingHours: { start: "09:00", end: "18:00" },
    });
    const panel = selectContextPanel({ snapshot, metrics: { deepWorkMinutes: 45 } });
    expect(panel.remainingMinutes).toBe(480);
    expect(panel.deepWorkMinutes).toBe(45);
    expect(panel.focusWindow.active).toBe(true);
  });
});

describe("selectDaySummary", () => {
  it("summarizes status, energy and trend", () => {
    const metrics: DailyMetrics = {
      date: "2026-07-06",
      completedTasks: 0,
      deepWorkMinutes: 30,
      meetings: 0,
      interruptions: 0,
      focusSwitches: 0,
      plannerAccuracy: null,
      energyEntries: [
        { at: "a", level: "low" },
        { at: "b", level: "high" },
      ],
    };
    const summary = selectDaySummary({
      state: state({ status: "active", energyLevel: "high" }),
      metrics,
    });
    expect(summary.status).toBe("active");
    expect(summary.energyLevel).toBe("high");
    expect(summary.deepWorkMinutes).toBe(30);
    expect(summary.energyTrend.trend).toBe("up");
  });
});
