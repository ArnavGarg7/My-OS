import { describe, expect, it } from "vitest";
import { collectCarryForward } from "./carryforward";
import { computeReadiness } from "./readiness";
import { tomorrowSignals } from "./decisions";
import { buildDayReview } from "./review";
import { buildRecommendations } from "./recommendations";
import { day, makeCarryForward, makeReadinessInput, makeReviewInput } from "./fixtures";
import type { CarryForwardCandidate } from "./types";

function build(
  over: {
    carry?: CarryForwardCandidate[];
    readiness?: Parameters<typeof makeReadinessInput>[0];
    review?: Parameters<typeof makeReviewInput>[0];
  } = {},
) {
  const review = buildDayReview(makeReviewInput(over.review), day(2026, 6, 7));
  const cf = collectCarryForward(over.carry ?? makeCarryForward());
  const readiness = computeReadiness(makeReadinessInput(over.readiness));
  const signals = tomorrowSignals(cf, readiness, 3);
  return buildRecommendations(review, cf, readiness, signals);
}

describe("buildRecommendations", () => {
  it("recommends reducing workload when overloaded", () => {
    const many: CarryForwardCandidate[] = Array.from({ length: 10 }, (_, i) => ({
      id: `x${i}`,
      kind: "task",
      title: `T${i}`,
      reason: "Overdue",
      entityId: `t${i}`,
    }));
    const recs = build({ carry: many });
    expect(recs.some((r) => r.id === "reduce-workload")).toBe(true);
  });
  it("recommends protecting focus on a heavy meeting day", () => {
    const recs = build({ readiness: { meetingMinutes: 220 } });
    expect(recs.some((r) => r.id === "protect-focus")).toBe(true);
  });
  it("recommends lowering intensity on low readiness", () => {
    const recs = build({
      readiness: { healthReadiness: 40, meetingMinutes: 240, expectedWorkloadMinutes: 240 },
    });
    expect(recs.some((r) => r.id === "lower-intensity")).toBe(true);
  });
  it("celebrates a strong day", () => {
    const recs = build({
      review: { tasksCompleted: 9, tasksCreated: 1, plannerAccuracy: 95 },
      carry: [],
    });
    expect(recs.some((r) => r.id === "strong-day")).toBe(true);
  });
  it("nudges journaling when not done", () => {
    const recs = build({ review: { journalCompleted: false }, carry: [] });
    expect(recs.some((r) => r.id === "journal")).toBe(true);
  });
  it("falls back to a balanced note", () => {
    const recs = build({
      carry: [],
      review: { journalCompleted: true, tasksCompleted: 5, tasksCreated: 3, plannerAccuracy: 60 },
    });
    expect(recs.length).toBeGreaterThan(0);
  });
});
