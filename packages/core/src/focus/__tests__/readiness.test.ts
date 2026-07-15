import { describe, expect, it } from "vitest";
import { readinessLevelFromScore } from "../constants";
import { buildReadiness, shouldLowerIntensity } from "../readiness";

describe("focus readiness", () => {
  it("maps scores into bands", () => {
    expect(readinessLevelFromScore(90)).toBe("ready");
    expect(readinessLevelFromScore(72)).toBe("good");
    expect(readinessLevelFromScore(60)).toBe("average");
    expect(readinessLevelFromScore(40)).toBe("low");
    expect(readinessLevelFromScore(20)).toBe("recovery_needed");
  });

  it("builds readiness from health input", () => {
    const r = buildReadiness({
      score: 88,
      hydrationPercent: 70,
      recovery: "high",
      sleepMinutes: 450,
    });
    expect(r.level).toBe("ready");
    expect(r.hydrationPercent).toBe(70);
    expect(r.sleepMinutes).toBe(450);
    expect(r.headline).toContain("deep work");
  });

  it("clamps out-of-range values", () => {
    const r = buildReadiness({ score: 130, hydrationPercent: -5, recovery: "x", sleepMinutes: -1 });
    expect(r.score).toBe(100);
    expect(r.hydrationPercent).toBe(0);
    expect(r.sleepMinutes).toBe(0);
  });

  it("returns a neutral fallback with no input", () => {
    const r = buildReadiness(null);
    expect(r.level).toBe("average");
    expect(r.score).toBe(0);
    expect(r.headline).toContain("No health data");
  });

  it("shouldLowerIntensity flags low and recovery_needed", () => {
    expect(
      shouldLowerIntensity(
        buildReadiness({ score: 40, hydrationPercent: 0, recovery: "", sleepMinutes: 0 }),
      ),
    ).toBe(true);
    expect(
      shouldLowerIntensity(
        buildReadiness({ score: 90, hydrationPercent: 0, recovery: "", sleepMinutes: 0 }),
      ),
    ).toBe(false);
  });
});
