/**
 * Habit Intelligence (Sprint 6.5, spec §Habit Intelligence). Deterministically models a habit from its
 * dated completion series: strength (recency-weighted completion rate), consistency (regularity of
 * gaps), trend (recent vs older), break probability (from the current gap) and recovery rate (resumes
 * after a miss). **Habit models never modify habits** — read-only intelligence. Pure — no AI.
 */
import type { HabitModel, HabitObservation } from "./types";
import { computeConfidence } from "./confidence";

const DAY_MS = 86_400_000;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Build a habit model from a completion series (chronological or not — sorted here). */
export function modelHabit(
  key: string,
  series: readonly HabitObservation[],
  now: Date,
): HabitModel | null {
  if (series.length === 0) return null;
  const days = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const completed = days.filter((d) => d.completed);
  const n = days.length;

  // Strength: recency-weighted completion (recent days count more).
  let wSum = 0;
  let wHit = 0;
  days.forEach((d, i) => {
    const w = 1 + i / n; // linearly heavier toward the end
    wSum += w;
    if (d.completed) wHit += w;
  });
  const strength = wSum > 0 ? clamp01(wHit / wSum) : 0;

  // Consistency: regularity of gaps between completions (1 = perfectly regular).
  const consistency = gapConsistency(completed.map((d) => new Date(d.date).getTime()));

  // Trend: compare completion rate of the recent half vs the older half.
  const mid = Math.floor(n / 2);
  const olderRate = rate(days.slice(0, mid));
  const recentRate = rate(days.slice(mid));
  const delta = recentRate - olderRate;
  const trend: HabitModel["trend"] = delta > 0.1 ? "rising" : delta < -0.1 ? "declining" : "steady";

  // Break probability: how long since the last completion vs the typical gap.
  const lastAt = completed.length
    ? new Date(completed[completed.length - 1]!.date).getTime()
    : null;
  const currentGapDays = lastAt !== null ? (now.getTime() - lastAt) / DAY_MS : Infinity;
  const typicalGap = typicalGapDays(completed.map((d) => new Date(d.date).getTime()));
  const breakProbability =
    lastAt === null ? 1 : clamp01((currentGapDays - typicalGap) / (typicalGap * 3 || 1));

  // Recovery rate: of the misses that had a following day, how often the user resumed next.
  const recoveryRate = computeRecovery(days);

  const times = days.map((d) => new Date(d.date).getTime());
  const timeSpanDays = (times[times.length - 1]! - times[0]!) / DAY_MS;
  const confidence = computeConfidence({
    observations: n,
    consistency,
    timeSpanDays,
    contradictions: 0,
    recencyDays: currentGapDays === Infinity ? 999 : currentGapDays,
  });

  return {
    key,
    strength: round2(strength),
    consistency: round2(consistency),
    trend,
    breakProbability: round2(breakProbability),
    recoveryRate: round2(recoveryRate),
    confidence,
    evidence: {
      observations: n,
      timeSpanDays: Math.round(timeSpanDays),
      source: "implicit",
      detail: `${completed.length}/${n} days completed, trend ${trend}`,
    },
  };
}

function rate(days: readonly HabitObservation[]): number {
  if (days.length === 0) return 0;
  return days.filter((d) => d.completed).length / days.length;
}

function gapConsistency(times: number[]): number {
  if (times.length < 3) return times.length >= 1 ? 0.5 : 0;
  const sorted = [...times].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) gaps.push((sorted[i]! - sorted[i - 1]!) / DAY_MS);
  const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  if (mean === 0) return 1;
  const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean; // coefficient of variation
  return clamp01(1 - cv);
}

function typicalGapDays(times: number[]): number {
  if (times.length < 2) return 1;
  const sorted = [...times].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) gaps.push((sorted[i]! - sorted[i - 1]!) / DAY_MS);
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] || 1; // median gap
}

function computeRecovery(days: readonly HabitObservation[]): number {
  let missWithNext = 0;
  let recovered = 0;
  for (let i = 0; i < days.length - 1; i += 1) {
    if (!days[i]!.completed) {
      missWithNext += 1;
      if (days[i + 1]!.completed) recovered += 1;
    }
  }
  return missWithNext === 0 ? 1 : clamp01(recovered / missWithNext);
}

const round2 = (n: number) => Math.round(n * 100) / 100;
