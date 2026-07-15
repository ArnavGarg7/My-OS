import { describe, expect, it } from "vitest";
import { at, makeGoal, makeKeyResult, makeObjective, makeReview } from "./fixtures";
import {
  createReview,
  defaultSummary,
  latestReview,
  progressDelta,
  reviewsForPeriod,
} from "./reviews";

const now = new Date(at(2026, 2, 25));
const goal = makeGoal({
  title: "Graduate",
  objectives: [
    makeObjective({ keyResults: [makeKeyResult({ metricType: "percentage", currentValue: 60 })] }),
  ],
});

describe("reviews", () => {
  it("creates a review with a progress snapshot", () => {
    const r = createReview(goal, "quarterly", "Good quarter", now);
    expect(r.reviewPeriod).toBe("quarterly");
    expect(r.summary).toBe("Good quarter");
    expect(r.progressSnapshot).toBe(60);
  });

  it("generates a default summary when none is given", () => {
    const r = createReview(goal, "monthly", "", now);
    expect(r.summary).toContain("Monthly review");
    expect(r.summary).toContain("Graduate");
  });

  it("builds a deterministic default summary", () => {
    expect(defaultSummary(goal, "weekly")).toContain("60%");
  });

  it("filters reviews by period + finds the latest", () => {
    const reviews = [
      makeReview({ id: "a", reviewPeriod: "quarterly", reviewedAt: at(2026, 2, 1) }),
      makeReview({ id: "b", reviewPeriod: "quarterly", reviewedAt: at(2026, 5, 1) }),
      makeReview({ id: "c", reviewPeriod: "weekly" }),
    ];
    expect(reviewsForPeriod(reviews, "quarterly").map((r) => r.id)).toEqual(["a", "b"]);
    expect(latestReview(reviews)?.id).toBe("b");
  });

  it("computes progress delta between reviews", () => {
    const reviews = [
      makeReview({
        id: "a",
        reviewPeriod: "quarterly",
        progressSnapshot: 40,
        reviewedAt: at(2026, 2, 1),
      }),
      makeReview({
        id: "b",
        reviewPeriod: "quarterly",
        progressSnapshot: 65,
        reviewedAt: at(2026, 5, 1),
      }),
    ];
    expect(progressDelta(reviews, "quarterly")).toBe(25);
  });

  it("returns null delta with a single review", () => {
    expect(progressDelta([makeReview()], "quarterly")).toBeNull();
  });
});
