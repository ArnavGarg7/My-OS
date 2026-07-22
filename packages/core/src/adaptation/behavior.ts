/**
 * Behavioral Analytics (Sprint 6.5, spec §Behavioral Analytics) + Decision Intelligence (§Decision
 * Intelligence). Deterministically derives named behavioral metrics from observations and learns which
 * proposal subjects the user repeatedly accepts/rejects (to personalize proposal presentation — never
 * to bypass approval). Pure — no AI, no clock.
 */
import type { BehavioralMetric, FeedbackRecord, Observation } from "./types";

const DAY_MS = 86_400_000;

/**
 * Compute behavioral metrics from observations. Observations carry numeric values keyed by metric
 * name (e.g. "focus_hours", "task_velocity"); we aggregate the recent mean and a trend vs the older
 * half. Non-numeric observations are ignored here.
 */
export function computeMetrics(
  observations: readonly Observation[],
  now: Date,
): BehavioralMetric[] {
  const byKey = new Map<string, Observation[]>();
  for (const o of observations) {
    if (typeof o.value !== "number") continue;
    const arr = byKey.get(o.key) ?? [];
    arr.push(o);
    byKey.set(o.key, arr);
  }

  const metrics: BehavioralMetric[] = [];
  for (const [key, obs] of byKey) {
    const sorted = [...obs].sort((a, b) => a.at.localeCompare(b.at));
    const values = sorted.map((o) => o.value as number);
    const mid = Math.floor(values.length / 2);
    const olderMean = mean(values.slice(0, mid));
    const recentMean = mean(values.slice(mid));
    const value = Math.round(mean(values) * 100) / 100;
    const trend: BehavioralMetric["trend"] =
      recentMean > olderMean * 1.05 ? "up" : recentMean < olderMean * 0.95 ? "down" : "flat";
    metrics.push({ key, label: humanize(key), value, unit: UNIT[key] ?? "", trend });
  }
  // Deterministic ordering.
  metrics.sort((a, b) => a.key.localeCompare(b.key));
  void now;
  void DAY_MS;
  return metrics;
}

/** Decision intelligence: for each proposal subject, the user's acceptance tendency in [-1, 1]. */
export function decisionTendencies(
  feedback: readonly FeedbackRecord[],
): { subject: string; tendency: number; samples: number }[] {
  const agg = new Map<string, { sum: number; n: number }>();
  for (const f of feedback) {
    const v =
      f.type === "excellent" || f.type === "helpful" ? 1 : f.type === "wrong_timing" ? 0 : -1;
    const cur = agg.get(f.subject) ?? { sum: 0, n: 0 };
    cur.sum += v;
    cur.n += 1;
    agg.set(f.subject, cur);
  }
  return [...agg.entries()]
    .map(([subject, { sum, n }]) => ({
      subject,
      tendency: Math.round((sum / n) * 100) / 100,
      samples: n,
    }))
    .sort((a, b) => b.samples - a.samples);
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const UNIT: Record<string, string> = {
  focus_hours: "h",
  task_velocity: "/day",
  study_efficiency: "%",
  meeting_load: "h/wk",
  decision_latency: "h",
};
