import { describe, expect, it } from "vitest";
import {
  activeDays,
  clampScore,
  countKind,
  dailyCounts,
  eventsInWindow,
  mean,
  metaNumber,
  pct,
  peakDay,
  round,
  sum,
  sumMeta,
} from "./metrics";
import { at, day, ev, makeEvents } from "./fixtures";

describe("scalar helpers", () => {
  it("clampScore bounds to 0–100", () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(42.6)).toBe(43);
  });
  it("pct + round + mean + sum", () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(1, 0)).toBe(0);
    expect(round(1.2345, 2)).toBe(1.23);
    expect(mean([2, 4])).toBe(3);
    expect(mean([])).toBe(0);
    expect(sum([1, 2, 3])).toBe(6);
  });
});

describe("event helpers", () => {
  const events = makeEvents();

  it("eventsInWindow is inclusive by date", () => {
    const win = eventsInWindow(events, day(2026, 6, 6), day(2026, 6, 6));
    expect(win.every((e) => e.timestamp.startsWith("2026-07-06"))).toBe(true);
    expect(win.length).toBeGreaterThan(0);
  });
  it("countKind tallies a kind", () => {
    expect(countKind(events, "task.completed")).toBe(2);
    expect(countKind(events, "habit.completed")).toBe(3);
  });
  it("metaNumber reads numeric metadata", () => {
    expect(metaNumber(ev({ metadata: { focusMinutes: 30 } }), "focusMinutes")).toBe(30);
    expect(metaNumber(ev({ metadata: {} }), "focusMinutes")).toBeNull();
  });
  it("sumMeta sums a field across events", () => {
    expect(sumMeta(events, "focusMinutes")).toBe(180);
  });
  it("dailyCounts + peakDay + activeDays", () => {
    const counts = dailyCounts(events);
    expect(counts[0]!.date <= counts[counts.length - 1]!.date).toBe(true);
    expect(peakDay(events)?.date).toBe(day(2026, 6, 6));
    expect(activeDays(events)).toBe(4);
  });
  it("peakDay is null for empty input", () => {
    expect(peakDay([])).toBeNull();
  });
  it("windows exclude out-of-range events", () => {
    const only = [ev({ timestamp: at(2020, 0, 1) })];
    expect(eventsInWindow(only, day(2026, 6, 1), day(2026, 6, 30))).toHaveLength(0);
  });
});
