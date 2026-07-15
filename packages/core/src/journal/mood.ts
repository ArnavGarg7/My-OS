import { MOOD_LEVELS, MOOD_SCORE, MOOD_WINDOW_DAYS, type MoodLevel } from "./constants";
import type { JournalEntry, JournalStreak, MoodTrend } from "./types";

/**
 * Mood engine (Sprint 2.10). Deterministic mood trend / average / streak,
 * derived only from journal entries. No AI. Correlations with sleep/planner
 * live in correlations.ts.
 */
export function scoreToLevel(score: number): MoodLevel {
  const rounded = Math.round(score);
  return (
    (MOOD_LEVELS.find((_, i) => i + 1 === Math.max(1, Math.min(5, rounded))) as MoodLevel) ??
    "neutral"
  );
}

function emptyDistribution(): Record<MoodLevel, number> {
  return { very_low: 0, low: 0, neutral: 0, good: 0, excellent: 0 };
}

/** Mood trend over the most recent `window` mood-bearing entries. */
export function moodTrend(entries: JournalEntry[], window = MOOD_WINDOW_DAYS): MoodTrend {
  const withMood = entries
    .filter((e) => e.mood !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (withMood.length === 0) {
    return {
      average: 0,
      latest: null,
      direction: "unknown",
      distribution: emptyDistribution(),
      samples: 0,
    };
  }
  const recent = withMood.slice(-window);
  const scores = recent.map((e) => MOOD_SCORE[e.mood!]);
  const average = Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 10) / 10;

  const distribution = emptyDistribution();
  for (const e of recent) distribution[e.mood!] += 1;

  let direction: MoodTrend["direction"] = "flat";
  if (recent.length >= 2) {
    const half = Math.floor(recent.length / 2);
    const firstAvg = avg(scores.slice(0, half || 1));
    const lastAvg = avg(scores.slice(-(half || 1)));
    direction = lastAvg > firstAvg + 0.25 ? "up" : lastAvg < firstAvg - 0.25 ? "down" : "flat";
  } else {
    direction = "unknown";
  }

  return {
    average,
    latest: recent.at(-1)!.mood,
    direction,
    distribution,
    samples: recent.length,
  };
}

/** Writing streak — consecutive days (ending today/yesterday) with an entry. */
export function writingStreak(entries: JournalEntry[], today: string): JournalStreak {
  const days = new Set(entries.map((e) => e.createdAt.slice(0, 10)));
  if (days.size === 0) return { current: 0, longest: 0, lastEntryDate: null };

  const sorted = [...days].sort();
  const lastEntryDate = sorted.at(-1)!;

  // Current streak: walk back from today (or yesterday if today is empty).
  let current = 0;
  let cursor = today;
  if (!days.has(cursor)) cursor = shiftDate(today, -1);
  while (days.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }

  // Longest streak across all recorded days.
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && shiftDate(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest, lastEntryDate };
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function avg(v: number[]): number {
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}
