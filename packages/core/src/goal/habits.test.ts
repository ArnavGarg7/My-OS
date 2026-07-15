import { describe, expect, it } from "vitest";
import { at, day, makeHabit } from "./fixtures";
import {
  analyzeHabit,
  completeHabit,
  completionPercent,
  computeStreaks,
  habitsProgress,
  isAtRisk,
  missedDays,
} from "./habits";

const now = new Date(at(2026, 6, 7));

describe("habits", () => {
  it("computes current + longest streaks", () => {
    const history = [day(2026, 6, 5), day(2026, 6, 6), day(2026, 6, 7)];
    expect(computeStreaks(history)).toEqual({ current: 3, longest: 3 });
  });

  it("breaks the streak on a gap", () => {
    const history = [day(2026, 6, 1), day(2026, 6, 6), day(2026, 6, 7)];
    const s = computeStreaks(history);
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });

  it("returns zero streaks with no history", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });

  it("computes completion percent over the window", () => {
    const habit = makeHabit({
      frequency: "daily",
      history: [day(2026, 6, 5), day(2026, 6, 6), day(2026, 6, 7)],
    });
    // 3 completions vs a 30-day expectation → 10%.
    expect(completionPercent(habit, now)).toBe(10);
  });

  it("counts missed days for a daily habit", () => {
    const habit = makeHabit({ frequency: "daily", history: [day(2026, 6, 7)] });
    expect(missedDays(habit, now, 7)).toBe(6);
  });

  it("flags an at-risk daily habit", () => {
    expect(isAtRisk(makeHabit({ frequency: "daily", lastCompleted: day(2026, 6, 4) }), now)).toBe(
      true,
    );
    expect(isAtRisk(makeHabit({ frequency: "daily", lastCompleted: day(2026, 6, 7) }), now)).toBe(
      false,
    );
  });

  it("completes a habit, updating history + streak", () => {
    const habit = completeHabit(makeHabit({ history: [day(2026, 6, 6)] }), day(2026, 6, 7));
    expect(habit.history).toContain(day(2026, 6, 7));
    expect(habit.currentStreak).toBe(2);
    expect(habit.lastCompleted).toBe(day(2026, 6, 7));
  });

  it("is idempotent when completing the same day twice", () => {
    const once = completeHabit(makeHabit(), day(2026, 6, 7));
    const twice = completeHabit(once, day(2026, 6, 7));
    expect(twice.history).toHaveLength(1);
  });

  it("analyzes a habit into stats", () => {
    const stats = analyzeHabit(makeHabit({ history: [day(2026, 6, 6), day(2026, 6, 7)] }), now);
    expect(stats.habit.currentStreak).toBe(2);
    expect(stats.completionPercent).toBeGreaterThan(0);
  });

  it("averages completion across active habits", () => {
    const habits = [
      makeHabit({ id: "a", history: [day(2026, 6, 7), day(2026, 6, 6), day(2026, 6, 5)] }),
      makeHabit({ id: "b", active: false, history: [] }),
    ];
    expect(habitsProgress(habits)).toBe(completionPercent(habits[0]!, new Date()));
  });
});
