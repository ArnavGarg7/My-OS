import { describe, expect, it } from "vitest";
import {
  activeHabits,
  atRiskHabits,
  averageConsistency,
  bestStreak,
  computeStreaks,
  dueToday,
  isAtRisk,
  isDue,
} from "../index";
import { dailyCompletions, makeHabit, FIXED_NOW } from "../fixtures";

const NOW = FIXED_NOW; // 2026-07-15T20:00Z

describe("habit streaks", () => {
  it("computes a daily current + longest streak", () => {
    const habit = makeHabit();
    const completions = dailyCompletions(habit.id, "2026-07-15", 10);
    const info = computeStreaks(habit, completions, NOW);
    expect(info.current).toBe(10);
    expect(info.longest).toBeGreaterThanOrEqual(10);
  });

  it("continues the streak if today isn't done yet but yesterday was", () => {
    const habit = makeHabit();
    const completions = dailyCompletions(habit.id, "2026-07-14", 5); // through yesterday
    expect(computeStreaks(habit, completions, NOW).current).toBe(5);
  });

  it("breaks the streak on a gap", () => {
    const habit = makeHabit();
    const completions = [
      ...dailyCompletions(habit.id, "2026-07-15", 2),
      { id: "gap", habitId: habit.id, date: "2026-07-10", completedAt: "2026-07-10T08:00:00Z" },
    ];
    expect(computeStreaks(habit, completions, NOW).current).toBe(2);
  });

  it("is deterministic", () => {
    const habit = makeHabit();
    const c = dailyCompletions(habit.id, "2026-07-15", 7);
    expect(computeStreaks(habit, c, NOW)).toEqual(computeStreaks(habit, c, NOW));
  });

  it("computes consistency + completion rate + missed days", () => {
    const habit = makeHabit();
    const completions = dailyCompletions(habit.id, "2026-07-15", 15); // 15 of 30 due
    const info = computeStreaks(habit, completions, NOW);
    expect(info.completionRate).toBe(50);
    expect(info.consistency).toBe(50);
    expect(info.missedDays).toBe(15);
  });

  it("gives a full recovery score when never missed", () => {
    const habit = makeHabit();
    expect(
      computeStreaks(habit, dailyCompletions(habit.id, "2026-07-15", 30), NOW).recoveryScore,
    ).toBe(100);
  });

  it("flags at-risk after the risk hour when due + undone", () => {
    const habit = makeHabit();
    expect(isAtRisk(habit, new Set(), NOW)).toBe(true); // 8pm, nothing done
    const morning = new Date("2026-07-15T09:00:00Z");
    expect(isAtRisk(habit, new Set(), morning)).toBe(false); // before risk hour
  });

  it("respects days-of-week for applicability", () => {
    // 2026-07-15 is a Wednesday (UTC getUTCDay = 3)
    const wed = makeHabit({ daysOfWeek: [3] });
    expect(isDue(wed, NOW)).toBe(true);
    const monOnly = makeHabit({ daysOfWeek: [1] });
    expect(isDue(monOnly, NOW)).toBe(false);
  });

  it("handles weekly frequency with a target", () => {
    const habit = makeHabit({ frequency: "weekly", target: 3 });
    // 3 completions in the current ISO week
    const completions = [
      { id: "w1", habitId: habit.id, date: "2026-07-13", completedAt: "2026-07-13T08:00:00Z" },
      { id: "w2", habitId: habit.id, date: "2026-07-14", completedAt: "2026-07-14T08:00:00Z" },
      { id: "w3", habitId: habit.id, date: "2026-07-15", completedAt: "2026-07-15T08:00:00Z" },
    ];
    const info = computeStreaks(habit, completions, NOW);
    expect(info.current).toBeGreaterThanOrEqual(1);
  });

  it("handles custom interval habits", () => {
    const habit = makeHabit({ frequency: "custom", target: 2, createdAt: "2026-07-01T00:00:00Z" });
    // due every 2 days from Jul 1 → Jul 15 is due (14 days = 7 intervals)
    expect(isDue(habit, NOW)).toBe(true);
  });
});

describe("habit selectors", () => {
  const habits = [makeHabit({ id: "h1" }), makeHabit({ id: "h2", archived: true })];
  const completions = dailyCompletions("h1", "2026-07-15", 5);

  it("filters active habits", () => {
    expect(activeHabits(habits)).toHaveLength(1);
  });

  it("lists habits due today (not yet done)", () => {
    // h1 done today → not due; make an undone one
    const withUndone = [...habits, makeHabit({ id: "h3" })];
    const due = dueToday(withUndone, completions, NOW);
    expect(due.map((h) => h.id)).toContain("h3");
    expect(due.map((h) => h.id)).not.toContain("h1");
  });

  it("computes best streak + average consistency", () => {
    expect(bestStreak(habits, completions, NOW)).toBe(5);
    expect(averageConsistency(habits, completions, NOW)).toBeGreaterThan(0);
  });

  it("finds at-risk habits", () => {
    const undone = [makeHabit({ id: "hx" })];
    expect(atRiskHabits(undone, [], NOW).map((h) => h.id)).toEqual(["hx"]);
  });
});
