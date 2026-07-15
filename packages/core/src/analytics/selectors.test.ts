import { describe, expect, it } from "vitest";
import { periodBounds, reportSpanDays, statistics, windowEvents } from "./selectors";
import { at, day, makeContext, makeEvents } from "./fixtures";

const NOW = new Date(at(2026, 6, 7, 18));

describe("reportSpanDays + periodBounds", () => {
  it("maps report types to spans", () => {
    expect(reportSpanDays("weekly")).toBe(7);
    expect(reportSpanDays("monthly")).toBe(30);
    expect(reportSpanDays("yearly")).toBe(365);
  });
  it("computes an inclusive weekly window", () => {
    const { start, end } = periodBounds("weekly", NOW);
    expect(end).toBe(day(2026, 6, 7));
    expect(start).toBe(day(2026, 6, 1));
  });
});

describe("statistics", () => {
  it("aggregates totals + overall score", () => {
    const s = statistics(makeContext({ now: NOW }), 7);
    expect(s.totalEvents).toBe(12);
    expect(s.activeDays).toBe(4);
    expect(s.bestDay?.date).toBe(day(2026, 6, 6));
    expect(s.overallScore).toBeGreaterThanOrEqual(0);
  });
});

describe("windowEvents", () => {
  it("slices to the last N days newest-first", () => {
    const win = windowEvents(makeEvents(), 7, NOW);
    expect(win[0]!.timestamp >= win[win.length - 1]!.timestamp).toBe(true);
  });
  it("excludes events outside the window", () => {
    const win = windowEvents(makeEvents(), 1, NOW);
    expect(win.every((e) => e.timestamp >= "2026-07-06")).toBe(true);
  });
});

describe("periodBounds monthly", () => {
  it("spans 30 days ending now", () => {
    const { start, end } = periodBounds("monthly", NOW);
    expect(end).toBe(day(2026, 6, 7));
    expect(start).toBe(day(2026, 5, 8));
  });
});
