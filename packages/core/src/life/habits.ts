import type { Habit, HabitCompletion } from "./types";
import { computeStreaks, isDue } from "./streaks";

/**
 * Habit selectors (Sprint 4.2). Pure read helpers over habits + their completions.
 */
export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archived);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Habits due today that have not yet been completed today. */
export function dueToday(habits: Habit[], completions: HabitCompletion[], now: Date): Habit[] {
  const today = ymd(now);
  const doneToday = new Set(completions.filter((c) => c.date === today).map((c) => c.habitId));
  return activeHabits(habits).filter((h) => isDue(h, now) && !doneToday.has(h.id));
}

/** Habits completed today. */
export function completedToday(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date,
): Habit[] {
  const today = ymd(now);
  const doneToday = new Set(completions.filter((c) => c.date === today).map((c) => c.habitId));
  return activeHabits(habits).filter((h) => doneToday.has(h.id));
}

export function completionsFor(completions: HabitCompletion[], habitId: string): HabitCompletion[] {
  return completions.filter((c) => c.habitId === habitId);
}

/** The best current streak across all active habits. */
export function bestStreak(habits: Habit[], completions: HabitCompletion[], now: Date): number {
  let best = 0;
  for (const h of activeHabits(habits)) {
    best = Math.max(best, computeStreaks(h, completionsFor(completions, h.id), now).current);
  }
  return best;
}

/** Average consistency (percent) across active habits. */
export function averageConsistency(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date,
): number {
  const active = activeHabits(habits);
  if (active.length === 0) return 0;
  const total = active.reduce(
    (n, h) => n + computeStreaks(h, completionsFor(completions, h.id), now).consistency,
    0,
  );
  return Math.round(total / active.length);
}

/** Habits whose streak is at risk right now. */
export function atRiskHabits(habits: Habit[], completions: HabitCompletion[], now: Date): Habit[] {
  return activeHabits(habits).filter(
    (h) => computeStreaks(h, completionsFor(completions, h.id), now).atRisk,
  );
}
