import { describe, expect, it } from "vitest";
import { analyzeEstimation } from "./estimation";

const NOW = new Date("2026-09-04T12:00:00Z");
const day = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

describe("analyzeEstimation", () => {
  it("reports unknown below the evidence floor (never invents a bias)", () => {
    const r = analyzeEstimation([{ estimateMinutes: 60, actualMinutes: 90, at: day(1) }], NOW);
    expect(r.direction).toBe("unknown");
    expect(r.biasRatio).toBeNull();
    expect(r.confidence.level).toBe("unknown");
    expect(r.adjustmentFactor).toBe(1);
    expect(r.headline).toBe("");
  });

  it("learns a consistent under-estimation bias from real pairs", () => {
    const pairs = Array.from({ length: 12 }, (_, i) => ({
      estimateMinutes: 60,
      actualMinutes: 90, // consistently 1.5×
      at: day(i * 2),
    }));
    const r = analyzeEstimation(pairs, NOW);
    expect(r.direction).toBe("under");
    expect(r.biasRatio).toBeCloseTo(1.5, 1);
    expect(r.biasPercent).toBe(50);
    expect(r.sampleSize).toBe(12);
    expect(r.headline).toMatch(/longer than estimated/);
    // Confident + consistent → the planner may apply the adjustment.
    expect(r.adjustmentFactor).toBeGreaterThan(1);
    expect(r.evidence.observations).toBe(12);
  });

  it("recognises accurate estimators (within ~10%)", () => {
    const pairs = Array.from({ length: 8 }, (_, i) => ({
      estimateMinutes: 60,
      actualMinutes: 62,
      at: day(i * 3),
    }));
    const r = analyzeEstimation(pairs, NOW);
    expect(r.direction).toBe("accurate");
    expect(r.headline).toMatch(/usually accurate/);
  });

  it("ignores pairs with no estimate or no actual", () => {
    const r = analyzeEstimation(
      [
        { estimateMinutes: 0, actualMinutes: 90, at: day(1) },
        { estimateMinutes: 60, actualMinutes: 0, at: day(2) },
      ],
      NOW,
    );
    expect(r.sampleSize).toBe(0);
    expect(r.direction).toBe("unknown");
  });
});
