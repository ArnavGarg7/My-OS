import { describe, expect, it } from "vitest";
import { at, makeEntry, makeReflection, makeReview } from "./fixtures";
import { createReview, latestReview, reviewsForPeriod, summarizeReview } from "./reviews";

const now = new Date(at(2026, 6, 7, 20));

describe("reviews", () => {
  it("creates a review trimming the summary", () => {
    const r = createReview("weekly", "  good week  ", now);
    expect(r.period).toBe("weekly");
    expect(r.summary).toBe("good week");
  });

  it("summarizes a period deterministically", () => {
    const reflections = [makeReflection({ wins: ["a", "b"], lessons: ["Ship smaller"] })];
    const entries = [makeEntry({ mood: "good" }), makeEntry({ id: "e2", mood: "excellent" })];
    const summary = summarizeReview("weekly", reflections, entries);
    expect(summary).toContain("Weekly review");
    expect(summary).toContain("2 wins");
    expect(summary).toContain("Ship smaller");
  });

  it("handles an empty period", () => {
    expect(summarizeReview("monthly", [], [])).toContain("Monthly review");
  });

  it("filters reviews by period + finds the latest", () => {
    const reviews = [
      makeReview({ id: "a", period: "weekly", createdAt: at(2026, 6, 1) }),
      makeReview({ id: "b", period: "weekly", createdAt: at(2026, 6, 7) }),
      makeReview({ id: "c", period: "monthly" }),
    ];
    expect(reviewsForPeriod(reviews, "weekly").map((r) => r.id)).toEqual(["a", "b"]);
    expect(latestReview(reviews, "weekly")?.id).toBe("b");
    expect(latestReview(reviews, "yearly")).toBeNull();
  });
});
