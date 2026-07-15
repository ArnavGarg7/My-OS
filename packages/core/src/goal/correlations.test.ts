import { describe, expect, it } from "vitest";
import { at, makeReview } from "./fixtures";
import { pearson, reviewMomentum } from "./correlations";

describe("correlations", () => {
  it("computes a perfect positive correlation", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 5);
  });

  it("returns 0 with no variance", () => {
    expect(pearson([5, 5, 5], [1, 2, 3])).toBe(0);
  });

  it("computes review momentum as average progress change", () => {
    const reviews = [
      makeReview({ id: "a", progressSnapshot: 20, reviewedAt: at(2026, 0, 1) }),
      makeReview({ id: "b", progressSnapshot: 40, reviewedAt: at(2026, 3, 1) }),
      makeReview({ id: "c", progressSnapshot: 70, reviewedAt: at(2026, 6, 1) }),
    ];
    expect(reviewMomentum(reviews)).toBe(25);
  });

  it("returns 0 momentum with a single review", () => {
    expect(reviewMomentum([makeReview()])).toBe(0);
  });
});
