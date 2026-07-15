import { describe, expect, it } from "vitest";
import { activitySeries, computeTimeline, weeklyActivity } from "./timeline";
import { day, makeEvents } from "./fixtures";

describe("computeTimeline", () => {
  it("summarises volume, average + peak", () => {
    const m = computeTimeline(makeEvents());
    expect(m.totalEvents).toBe(12);
    expect(m.activeDays).toBe(4);
    expect(m.peakDay?.date).toBe(day(2026, 6, 6));
    expect(m.bySource.goal).toBe(4);
  });
  it("is empty-safe", () => {
    const m = computeTimeline([]);
    expect(m.totalEvents).toBe(0);
    expect(m.dailyAverage).toBe(0);
    expect(m.peakDay).toBeNull();
  });
});

describe("activitySeries + weeklyActivity", () => {
  it("returns oldest-first daily counts", () => {
    const series = activitySeries(makeEvents());
    expect(series[0]!.date <= series[series.length - 1]!.date).toBe(true);
  });
  it("rolls up by week", () => {
    const weeks = weeklyActivity(makeEvents());
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks.reduce((s, w) => s + w.count, 0)).toBe(12);
  });
  it("keys weeks by their Monday", () => {
    const weeks = weeklyActivity(makeEvents());
    // 2026-07-06 is a Monday.
    expect(weeks.some((w) => w.week === day(2026, 6, 6))).toBe(true);
  });
  it("computes a daily average per active day", () => {
    const m = computeTimeline(makeEvents());
    expect(m.dailyAverage).toBe(3); // 12 events / 4 active days
  });
});
