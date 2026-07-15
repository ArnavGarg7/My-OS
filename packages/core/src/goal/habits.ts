import { CONSISTENCY_WINDOW_DAYS, STREAK_AT_RISK_DAYS, type HabitFrequency } from "./constants";
import type { Habit, HabitStats } from "./types";

/**
 * Habit engine (Sprint 2.12). Deterministic streak / completion / consistency /
 * missed-days from a habit's completion history. Habits belong to goals and
 * model the recurring behaviours that advance them.
 */
const DAY_MS = 86_400_000;

export function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Expected completions across the window for a frequency. */
export function expectedCompletions(frequency: HabitFrequency, windowDays: number): number {
  if (frequency === "daily") return windowDays;
  if (frequency === "weekly") return Math.round(windowDays / 7);
  return Math.round(windowDays / 30);
}

/** Recompute the current + longest streak from the (daily) completion history. */
export function computeStreaks(history: string[]): { current: number; longest: number } {
  const days = [...new Set(history.map(toDateKey))].sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev !== null && shiftDate(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  // Current streak walks back from the last completion.
  let current = 0;
  let cursor = days.at(-1)!;
  const set = new Set(days);
  while (set.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { current, longest };
}

export function completionPercent(
  habit: Habit,
  now: Date = new Date(),
  windowDays = CONSISTENCY_WINDOW_DAYS,
): number {
  const cutoff = shiftDate(now.toISOString().slice(0, 10), -windowDays);
  const done = [...new Set(habit.history.map(toDateKey))].filter((d) => d >= cutoff).length;
  const expected = Math.max(1, expectedCompletions(habit.frequency, windowDays));
  return Math.min(100, Math.round((done / expected) * 100));
}

export function missedDays(habit: Habit, now: Date, windowDays = CONSISTENCY_WINDOW_DAYS): number {
  if (habit.frequency !== "daily") return 0;
  const start = shiftDate(now.toISOString().slice(0, 10), -windowDays + 1);
  const done = new Set(habit.history.map(toDateKey));
  let missed = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = shiftDate(start, i);
    if (d > now.toISOString().slice(0, 10)) break;
    if (!done.has(d)) missed += 1;
  }
  return missed;
}

/** A daily habit is "at risk" when it wasn't completed today or yesterday. */
export function isAtRisk(habit: Habit, now: Date): boolean {
  if (!habit.active || !habit.lastCompleted) return habit.active;
  const gap = Math.floor((now.getTime() - new Date(habit.lastCompleted).getTime()) / DAY_MS);
  return habit.frequency === "daily" && gap > STREAK_AT_RISK_DAYS;
}

export function analyzeHabit(habit: Habit, now: Date): HabitStats {
  const streaks = computeStreaks(habit.history);
  const completion = completionPercent(habit, now);
  return {
    habit: {
      ...habit,
      currentStreak: streaks.current,
      longestStreak: Math.max(streaks.longest, habit.longestStreak),
    },
    completionPercent: completion,
    consistency: completion,
    missedDays: missedDays(habit, now),
    atRisk: isAtRisk(habit, now),
  };
}

/** Mark a habit complete for a date, updating streaks + history. */
export function completeHabit(habit: Habit, date: string): Habit {
  const key = toDateKey(date);
  if (habit.history.includes(key)) return habit;
  const history = [...habit.history, key].sort();
  const streaks = computeStreaks(history);
  return {
    ...habit,
    history,
    lastCompleted: key,
    currentStreak: streaks.current,
    longestStreak: Math.max(streaks.longest, habit.longestStreak),
  };
}

/** Average completion % across active habits. */
export function habitsProgress(habits: Habit[]): number {
  const active = habits.filter((h) => h.active);
  if (active.length === 0) return 0;
  return Math.round(active.reduce((s, h) => s + completionPercent(h), 0) / active.length);
}
