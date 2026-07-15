import { MOOD_SCORE } from "./constants";
import type { JournalEntry } from "./types";

/**
 * Journal correlations (Sprint 2.10). Pure descriptive statistics relating mood
 * (from journal entries) to an external daily series (e.g. sleep minutes or
 * planner completion). Pearson only — no AI inference.
 */
export interface JournalCorrelation {
  a: string;
  b: string;
  coefficient: number; // -1..1
  strength: "none" | "weak" | "moderate" | "strong";
  samples: number;
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i]! - mx;
    const b = y[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, num / denom));
}

export function strengthOf(coefficient: number): JournalCorrelation["strength"] {
  const abs = Math.abs(coefficient);
  if (abs < 0.2) return "none";
  if (abs < 0.4) return "weak";
  if (abs < 0.7) return "moderate";
  return "strong";
}

/**
 * Correlate mood against a named daily metric. `metricByDate` maps YYYY-MM-DD →
 * value; only days with both a mood entry and a metric are used.
 */
export function correlateMood(
  entries: JournalEntry[],
  metricName: string,
  metricByDate: Map<string, number>,
): JournalCorrelation {
  const moodByDate = new Map<string, number>();
  for (const e of entries) {
    if (e.mood) moodByDate.set(e.createdAt.slice(0, 10), MOOD_SCORE[e.mood]);
  }
  const days = [...moodByDate.keys()].filter((d) => metricByDate.has(d)).sort();
  const moods = days.map((d) => moodByDate.get(d)!);
  const metrics = days.map((d) => metricByDate.get(d)!);
  const coefficient = Math.round(pearson(metrics, moods) * 100) / 100;
  return {
    a: metricName,
    b: "mood",
    coefficient,
    strength: strengthOf(coefficient),
    samples: days.length,
  };
}
