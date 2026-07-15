import { describe, expect, it } from "vitest";
import { buildDayReview } from "./review";
import { day, makeReviewInput } from "./fixtures";

describe("buildDayReview", () => {
  it("computes a completion score from tasks + planner", () => {
    const r = buildDayReview(
      makeReviewInput({ tasksCompleted: 8, tasksCreated: 2, plannerAccuracy: 90 }),
      day(2026, 6, 7),
    );
    // taskCompletion 80% *0.6 + 90 *0.4 = 84
    expect(r.completionScore).toBe(84);
    expect(r.headline).toMatch(/strong day/i);
  });
  it("headline softens for a lighter day", () => {
    const r = buildDayReview(
      makeReviewInput({ tasksCompleted: 1, tasksCreated: 9, plannerAccuracy: 20 }),
      day(2026, 6, 7),
    );
    expect(r.completionScore).toBeLessThan(50);
    expect(r.headline).toMatch(/lighter day/i);
  });
  it("handles a day with no tasks", () => {
    const r = buildDayReview(
      makeReviewInput({ tasksCompleted: 0, tasksCreated: 0, plannerAccuracy: 0 }),
      day(2026, 6, 7),
    );
    expect(r.completionScore).toBe(0);
  });
  it("clamps + carries through the domain metrics", () => {
    const r = buildDayReview(
      makeReviewInput({ goalProgress: 150, healthReadiness: -5, calendarCompletion: 100 }),
      day(2026, 6, 7),
    );
    expect(r.goalProgress).toBe(100);
    expect(r.healthReadiness).toBe(0);
    expect(r.calendarCompletion).toBe(100);
    expect(r.planningDate).toBe(day(2026, 6, 7));
  });
  it("preserves raw counts + deep work", () => {
    const r = buildDayReview(
      makeReviewInput({
        tasksCompleted: 7,
        tasksCreated: 3,
        deepWorkMinutes: 200,
        decisionsAccepted: 4,
      }),
      day(2026, 6, 7),
    );
    expect(r.tasksCompleted).toBe(7);
    expect(r.tasksCreated).toBe(3);
    expect(r.deepWorkMinutes).toBe(200);
    expect(r.decisionsAccepted).toBe(4);
  });
  it("mid headline for a solid day", () => {
    const r = buildDayReview(
      makeReviewInput({ tasksCompleted: 5, tasksCreated: 5, plannerAccuracy: 60 }),
      day(2026, 6, 7),
    );
    expect(r.completionScore).toBeGreaterThanOrEqual(50);
    expect(r.completionScore).toBeLessThan(80);
    expect(r.headline).toMatch(/solid day/i);
  });
  it("carries the journal flag", () => {
    expect(
      buildDayReview(makeReviewInput({ journalCompleted: false }), day(2026, 6, 7))
        .journalCompleted,
    ).toBe(false);
  });
});
