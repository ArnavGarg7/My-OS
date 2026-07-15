import { describe, expect, it } from "vitest";
import { makeSleep } from "./fixtures";
import { analyzeSleep } from "./sleep";
import { computeReadiness, toBand } from "./readiness";
import { resolveEnergy } from "./energy";
import { summarizeHydration } from "./hydration";
import type { RecoveryResult } from "./types";

const recovery = (score: number): RecoveryResult => ({
  status: score >= 80 ? "recovered" : "recovering",
  score,
  reasons: [],
});

describe("readiness", () => {
  it("is high with good inputs across the board", () => {
    const sleep = analyzeSleep(makeSleep({ durationMinutes: 480, quality: 95 }));
    const hydration = summarizeHydration(
      [{ id: "a", time: "", amountMl: 3000, source: "water" }],
      3000,
    );
    const energy = resolveEnergy("high", sleep);
    const r = computeReadiness({ sleep, recovery: recovery(90), hydration, energy });
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.band).toBe("high");
    expect(r.recommendation).toMatch(/hardest/i);
  });

  it("is low with poor inputs", () => {
    const sleep = analyzeSleep(makeSleep({ durationMinutes: 300, quality: 30 }));
    const hydration = summarizeHydration([], 3000);
    const energy = resolveEnergy("low", sleep);
    const r = computeReadiness({ sleep, recovery: recovery(30), hydration, energy });
    expect(r.score).toBeLessThan(50);
    expect(["low", "very_low"]).toContain(r.band);
  });

  it("exposes its input breakdown", () => {
    const sleep = analyzeSleep(makeSleep({ durationMinutes: 450 }));
    const hydration = summarizeHydration([], 3000);
    const energy = resolveEnergy("medium", sleep);
    const r = computeReadiness({ sleep, recovery: recovery(70), hydration, energy });
    expect(r.inputs.recovery).toBe(70);
    expect(r.inputs.hydration).toBe(0);
  });

  it("bands scores deterministically", () => {
    expect(toBand(90)).toBe("high");
    expect(toBand(60)).toBe("moderate");
    expect(toBand(35)).toBe("low");
    expect(toBand(10)).toBe("very_low");
  });
});
