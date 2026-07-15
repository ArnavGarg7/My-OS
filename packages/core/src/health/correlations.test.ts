import { describe, expect, it } from "vitest";
import { correlate, pearson, strengthOf } from "./correlations";

describe("correlations", () => {
  it("returns +1 for a perfect positive relationship", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 5);
  });

  it("returns -1 for a perfect negative relationship", () => {
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1, 5);
  });

  it("returns 0 for constant series (no variance)", () => {
    expect(pearson([5, 5, 5], [1, 2, 3])).toBe(0);
  });

  it("returns 0 with fewer than 2 samples", () => {
    expect(pearson([1], [2])).toBe(0);
  });

  it("classifies strength bands", () => {
    expect(strengthOf(0.1)).toBe("none");
    expect(strengthOf(0.3)).toBe("weak");
    expect(strengthOf(0.5)).toBe("moderate");
    expect(strengthOf(0.9)).toBe("strong");
  });

  it("builds a named Correlation with sample count", () => {
    const c = correlate("sleep", [1, 2, 3], "energy", [1, 2, 3]);
    expect(c.a).toBe("sleep");
    expect(c.coefficient).toBe(1);
    expect(c.strength).toBe("strong");
    expect(c.samples).toBe(3);
  });
});
