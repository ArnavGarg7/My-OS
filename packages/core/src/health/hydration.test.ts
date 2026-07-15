import { describe, expect, it } from "vitest";
import { at, makeHydration } from "./fixtures";
import { longestGap, pace, summarizeHydration } from "./hydration";

describe("hydration", () => {
  it("totals only water toward the goal", () => {
    const logs = [
      makeHydration({ id: "a", amountMl: 500, source: "water" }),
      makeHydration({ id: "b", amountMl: 300, source: "coffee" }),
    ];
    const s = summarizeHydration(logs, 3000);
    expect(s.totalMl).toBe(500);
  });

  it("computes remaining + completion percent", () => {
    const s = summarizeHydration([makeHydration({ amountMl: 1500 })], 3000);
    expect(s.remainingMl).toBe(1500);
    expect(s.completionPercent).toBe(50);
  });

  it("caps completion at 100%", () => {
    const s = summarizeHydration([makeHydration({ amountMl: 4000 })], 3000);
    expect(s.completionPercent).toBe(100);
    expect(s.remainingMl).toBe(0);
  });

  it("finds the longest gap between logs", () => {
    const logs = [
      makeHydration({ id: "a", time: at(8, 0) }),
      makeHydration({ id: "b", time: at(9, 0) }),
      makeHydration({ id: "c", time: at(13, 0) }),
    ];
    expect(longestGap(logs)).toBe(240);
  });

  it("extends the gap to now when provided", () => {
    const logs = [makeHydration({ time: at(8, 0) })];
    expect(longestGap(logs, new Date(at(10, 0)))).toBe(120);
  });

  it("returns 0 gap for no logs", () => {
    expect(longestGap([])).toBe(0);
  });

  it("paces the remaining intake across the day", () => {
    const s = summarizeHydration([makeHydration({ amountMl: 1000 })], 3000);
    expect(pace(s, 4)).toBe(500);
  });

  it("paces 0 when the goal is met", () => {
    const s = summarizeHydration([makeHydration({ amountMl: 3000 })], 3000);
    expect(pace(s, 4)).toBe(0);
  });
});
