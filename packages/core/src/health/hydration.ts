import { DEFAULT_GOALS } from "./constants";
import type { HydrationLog, HydrationSummary } from "./types";

/**
 * Hydration engine (Sprint 2.9). Deterministic intake vs goal, remaining,
 * completion % and the longest gap without water. Only water counts toward the
 * goal; other sources are logged but don't fill the bar.
 */
export function summarizeHydration(
  logs: HydrationLog[],
  goalMl: number = DEFAULT_GOALS.waterMl,
  now?: Date,
): HydrationSummary {
  const water = logs.filter((l) => l.source === "water");
  const totalMl = water.reduce((s, l) => s + Math.max(0, l.amountMl), 0);
  const remainingMl = Math.max(0, goalMl - totalMl);
  const completionPercent = goalMl > 0 ? Math.min(100, Math.round((totalMl / goalMl) * 100)) : 0;
  return {
    totalMl,
    goalMl,
    remainingMl,
    completionPercent,
    longestGapMinutes: longestGap(logs, now),
  };
}

/** Longest gap (minutes) between consecutive hydration events (any source). */
export function longestGap(logs: HydrationLog[], now?: Date): number {
  if (logs.length === 0) return 0;
  const times = logs.map((l) => new Date(l.time).getTime()).sort((a, b) => a - b);
  let max = 0;
  for (let i = 1; i < times.length; i++) {
    max = Math.max(max, times[i]! - times[i - 1]!);
  }
  if (now) max = Math.max(max, now.getTime() - times.at(-1)!);
  return Math.round(max / 60000);
}

/** Suggested next-glass size to stay on pace across the remaining day. */
export function pace(summary: HydrationSummary, hoursLeft: number): number {
  if (summary.remainingMl <= 0 || hoursLeft <= 0) return 0;
  return Math.round(summary.remainingMl / Math.max(1, hoursLeft));
}
