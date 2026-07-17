import { CONSISTENCY_WINDOW_DAYS, STREAK_AT_RISK_HOUR } from "./constants";
import type { Habit, HabitCompletion, StreakInfo } from "./types";

/**
 * Habit streak engine (Sprint 4.2). PURE, deterministic derivations from completion
 * history — current/longest streak, consistency, completion rate, missed days, a recovery
 * score and an at-risk flag. Nothing derived is stored. Daily habits streak day-by-day
 * (honouring days-of-week); weekly/monthly streak by period target.
 */

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function parse(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function isoWeekKey(d: Date): string {
  // ISO week: Thursday-based. Deterministic bucketing.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Whether a habit applies on a given date (daysOfWeek filter for daily habits). */
export function isApplicableDay(habit: Habit, date: Date): boolean {
  if (habit.frequency !== "daily" && habit.frequency !== "custom") return true;
  if (habit.daysOfWeek.length === 0) return true;
  return habit.daysOfWeek.includes(date.getUTCDay());
}

/** Custom habits are due every `target` days from creation. */
function customDue(habit: Habit, date: Date): boolean {
  const start = parse(ymd(new Date(habit.createdAt)));
  const days = Math.round((date.getTime() - start.getTime()) / 86_400_000);
  return days >= 0 && days % Math.max(1, habit.target) === 0;
}

function completedDates(completions: HabitCompletion[]): Set<string> {
  return new Set(completions.map((c) => c.date));
}

function dailyStreak(
  habit: Habit,
  done: Set<string>,
  now: Date,
): { current: number; longest: number } {
  const today = parse(ymd(now));
  // Current: walk back from today; if today is applicable but not done, start from yesterday.
  let cursor = today;
  if (isApplicableDay(habit, today) && !done.has(ymd(today))) cursor = addDays(today, -1);

  let current = 0;
  for (let i = 0; i < 3650; i++) {
    const due =
      habit.frequency === "custom" ? customDue(habit, cursor) : isApplicableDay(habit, cursor);
    if (!due) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (done.has(ymd(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    } else break;
  }

  // Longest: scan the full completion span.
  const sorted = [...done].sort();
  let longest = 0;
  let run = 0;
  if (sorted.length > 0) {
    let d = parse(sorted[0]!);
    const end = today;
    while (d.getTime() <= end.getTime()) {
      const due = habit.frequency === "custom" ? customDue(habit, d) : isApplicableDay(habit, d);
      if (due) {
        if (done.has(ymd(d))) {
          run += 1;
          longest = Math.max(longest, run);
        } else run = 0;
      }
      d = addDays(d, 1);
    }
  }
  return { current, longest: Math.max(longest, current) };
}

function periodStreak(
  keyFn: (d: Date) => string,
  stepBack: (d: Date) => Date,
  target: number,
  done: Set<string>,
  now: Date,
): { current: number; longest: number } {
  const counts = new Map<string, number>();
  for (const date of done) {
    const k = keyFn(parse(date));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const met = (k: string) => (counts.get(k) ?? 0) >= target;

  // Longest: contiguous run of met periods across the sorted period keys.
  const keys = [...counts.keys()].sort();
  let longest = 0;
  let run = 0;
  for (const k of keys) {
    run = met(k) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Current: walk back period-by-period from now while each period is met.
  let current = 0;
  let cursor = now;
  for (let i = 0; i < 520; i++) {
    if (met(keyFn(cursor))) {
      current += 1;
      cursor = stepBack(cursor);
    } else break;
  }
  return { current, longest: Math.max(longest, current) };
}

export function computeStreaks(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date,
): StreakInfo {
  const done = completedDates(completions);
  const windowStart = addDays(parse(ymd(now)), -(CONSISTENCY_WINDOW_DAYS - 1));

  let streak: { current: number; longest: number };
  if (habit.frequency === "weekly")
    streak = periodStreak(isoWeekKey, (d) => addDays(d, -7), habit.target, done, now);
  else if (habit.frequency === "monthly")
    streak = periodStreak(
      monthKey,
      (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 15)),
      habit.target,
      done,
      now,
    );
  else streak = dailyStreak(habit, done, now);

  // Consistency + completion rate over the window: count applicable/due days.
  let dueDays = 0;
  let completedDue = 0;
  let d = windowStart;
  const today = parse(ymd(now));
  while (d.getTime() <= today.getTime()) {
    const due =
      habit.frequency === "custom"
        ? customDue(habit, d)
        : habit.frequency === "daily"
          ? isApplicableDay(habit, d)
          : true; // weekly/monthly: treat every day as a completion opportunity
    if (due && (habit.frequency === "daily" || habit.frequency === "custom")) {
      dueDays += 1;
      if (done.has(ymd(d))) completedDue += 1;
    }
    d = addDays(d, 1);
  }
  if (habit.frequency === "weekly" || habit.frequency === "monthly") {
    // Consistency = completions in window / expected completions.
    const windowDays = CONSISTENCY_WINDOW_DAYS;
    const expected =
      habit.frequency === "weekly"
        ? (windowDays / 7) * habit.target
        : (windowDays / 30) * habit.target;
    const got = [...done].filter((x) => parse(x).getTime() >= windowStart.getTime()).length;
    dueDays = Math.max(1, Math.round(expected));
    completedDue = got;
  }

  const completionRate = dueDays > 0 ? Math.round((completedDue / dueDays) * 100) : 0;
  const missedDays = Math.max(0, dueDays - completedDue);
  const consistency = Math.min(100, completionRate);
  // Recovery score: reward comebacks — completed days that immediately follow a miss.
  const recoveryScore = recoveryScoreFor(habit, done, windowStart, today);
  const atRisk = isAtRisk(habit, done, now);

  return {
    current: streak.current,
    longest: streak.longest,
    consistency,
    completionRate,
    missedDays,
    recoveryScore,
    atRisk,
  };
}

function recoveryScoreFor(habit: Habit, done: Set<string>, from: Date, to: Date): number {
  let misses = 0;
  let recovered = 0;
  let prevMissed = false;
  let d = from;
  while (d.getTime() <= to.getTime()) {
    const due = habit.frequency === "custom" ? customDue(habit, d) : isApplicableDay(habit, d);
    if (due && (habit.frequency === "daily" || habit.frequency === "custom")) {
      const isDone = done.has(ymd(d));
      if (prevMissed && isDone) recovered += 1;
      if (!isDone) {
        misses += 1;
        prevMissed = true;
      } else prevMissed = false;
    }
    d = addDays(d, 1);
  }
  if (misses === 0) return 100;
  return Math.round((recovered / misses) * 100);
}

/** A daily/custom habit is at risk if it's due today, not done, and past the risk hour. */
export function isAtRisk(habit: Habit, done: Set<string>, now: Date): boolean {
  if (habit.archived) return false;
  const today = parse(ymd(now));
  const due =
    habit.frequency === "custom" ? customDue(habit, today) : isApplicableDay(habit, today);
  if (!due || habit.frequency === "weekly" || habit.frequency === "monthly") return false;
  return !done.has(ymd(today)) && now.getUTCHours() >= STREAK_AT_RISK_HOUR;
}

/** Whether a habit is due (expected) on the given day. */
export function isDue(habit: Habit, now: Date): boolean {
  const today = parse(ymd(now));
  if (habit.frequency === "custom") return customDue(habit, today);
  if (habit.frequency === "weekly" || habit.frequency === "monthly") return true;
  return isApplicableDay(habit, today);
}
