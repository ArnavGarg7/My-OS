import { describe, expect, it } from "vitest";
import { makeSleep } from "./fixtures";
import { analyzeSleep } from "./sleep";
import { resolveEnergy, scoreToLevel } from "./energy";

describe("energy", () => {
  it("uses the logged level when present", () => {
    const r = resolveEnergy("high", null);
    expect(r.level).toBe("high");
    expect(r.source).toBe("logged");
  });

  it("derives energy from sleep when unlogged", () => {
    const sleep = analyzeSleep(makeSleep({ durationMinutes: 480, quality: 95 }));
    const r = resolveEnergy(null, sleep);
    expect(r.source).toBe("derived");
    expect(r.level).toBe("high");
  });

  it("defaults to medium without any signal", () => {
    const r = resolveEnergy(null, null);
    expect(r.level).toBe("medium");
    expect(r.score).toBe(50);
  });

  it("maps scores to levels", () => {
    expect(scoreToLevel(90)).toBe("high");
    expect(scoreToLevel(60)).toBe("medium");
    expect(scoreToLevel(20)).toBe("low");
  });
});
