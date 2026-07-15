import { describe, expect, it } from "vitest";
import { day, makeSavingsGoal } from "./fixtures";
import {
  contribute,
  isComplete,
  isNearlyComplete,
  progressPercent,
  projectCompletion,
  remaining,
  savingsProgress,
} from "./savings";

const now = new Date(`${day(2026, 6, 7)}T12:00:00Z`);

describe("savings", () => {
  it("computes progress + remaining", () => {
    const g = makeSavingsGoal({ targetAmount: 100000, currentAmount: 40000 });
    expect(progressPercent(g)).toBe(40);
    expect(remaining(g)).toBe(60000);
  });

  it("detects completion + nearly-complete", () => {
    expect(isComplete(makeSavingsGoal({ currentAmount: 100000, targetAmount: 100000 }))).toBe(true);
    expect(isNearlyComplete(makeSavingsGoal({ currentAmount: 95000, targetAmount: 100000 }))).toBe(
      true,
    );
    expect(isNearlyComplete(makeSavingsGoal({ currentAmount: 40000, targetAmount: 100000 }))).toBe(
      false,
    );
  });

  it("projects a completion date from the contribution rate", () => {
    const g = makeSavingsGoal({ targetAmount: 100000, currentAmount: 40000, deadline: null });
    // 60000 remaining at 20000/month → 3 months.
    expect(projectCompletion(g, 20000, now)).toBe("2026-10-05");
  });

  it("returns null projection without a contribution rate", () => {
    expect(projectCompletion(makeSavingsGoal({ currentAmount: 0 }), 0, now)).toBeNull();
  });

  it("flags off-track against a deadline", () => {
    const g = makeSavingsGoal({
      targetAmount: 100000,
      currentAmount: 10000,
      deadline: day(2026, 6, 30),
    });
    expect(savingsProgress(g, 5000, now).onTrack).toBe(false);
  });

  it("contributes and completes at target", () => {
    const g = makeSavingsGoal({ targetAmount: 100000, currentAmount: 95000, completedAt: null });
    const next = contribute(g, 5000, now);
    expect(next.currentAmount).toBe(100000);
    expect(next.completedAt).not.toBeNull();
  });
});
