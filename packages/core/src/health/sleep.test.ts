import { describe, expect, it } from "vitest";
import { at, makeSleep } from "./fixtures";
import {
  analyzeSleep,
  clockVariance,
  durationBetween,
  rollingAverage,
  sleepDebt,
  sleepScore,
} from "./sleep";

describe("sleep", () => {
  it("computes duration between bed and wake", () => {
    expect(durationBetween(at(23, 0, 6), at(7, 0, 7))).toBe(480);
  });

  it("scores an ideal 8h night near 100", () => {
    const s = makeSleep({ durationMinutes: 480, quality: 100 });
    expect(sleepScore(s)).toBe(100);
  });

  it("penalizes a short 5h night", () => {
    const s = makeSleep({ durationMinutes: 300, quality: 60 });
    expect(sleepScore(s)).toBeLessThan(70);
  });

  it("blends quality into the score", () => {
    const high = sleepScore(makeSleep({ durationMinutes: 480, quality: 90 }));
    const low = sleepScore(makeSleep({ durationMinutes: 480, quality: 40 }));
    expect(high).toBeGreaterThan(low);
  });

  it("computes a rolling average", () => {
    const sessions = [
      makeSleep({ id: "a", durationMinutes: 400 }),
      makeSleep({ id: "b", durationMinutes: 500 }),
    ];
    expect(rollingAverage(sessions)).toBe(450);
  });

  it("accrues sleep debt below the ideal", () => {
    const sessions = [
      makeSleep({ id: "a", durationMinutes: 420 }),
      makeSleep({ id: "b", durationMinutes: 420 }),
    ];
    expect(sleepDebt(sessions)).toBe(120);
  });

  it("clamps sleep debt at zero when over the ideal", () => {
    expect(sleepDebt([makeSleep({ durationMinutes: 540 })])).toBe(0);
  });

  it("reports near-zero variance for consistent times", () => {
    const isos = [at(23, 0, 5), at(23, 0, 6), at(23, 0, 7)];
    expect(clockVariance(isos)).toBeLessThan(5);
  });

  it("reports higher variance for scattered times", () => {
    const consistent = clockVariance([at(23, 0, 5), at(23, 5, 6)]);
    const scattered = clockVariance([at(21, 0, 5), at(2, 0, 6)]);
    expect(scattered).toBeGreaterThan(consistent);
  });

  it("analyzes a night with history", () => {
    const latest = makeSleep({ id: "latest", durationMinutes: 465 });
    const history = [makeSleep({ id: "a", durationMinutes: 450 })];
    const a = analyzeSleep(latest, history);
    expect(a?.durationMinutes).toBe(465);
    expect(a?.consistency).toBeGreaterThanOrEqual(0);
    expect(a?.rollingAverageMinutes).toBeGreaterThan(0);
  });

  it("returns null without a latest session", () => {
    expect(analyzeSleep(null)).toBeNull();
  });
});
