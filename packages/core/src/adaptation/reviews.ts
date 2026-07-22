/**
 * Weekly & Monthly Intelligence Reviews (Sprint 6.5, spec §Weekly/Monthly Review). Deterministic,
 * REPRODUCIBLE summaries assembled from the learned models + metrics + feedback for a period. No
 * generative storytelling — every line is a template filled from evidence. Pure — no AI, no clock
 * (period bounds + now injected). Re-running over the same history yields the same review.
 */
import type {
  BehavioralMetric,
  FeedbackRecord,
  HabitModel,
  Insight,
  MonthlyReview,
  Preference,
  RoutineModel,
  WeeklyReview,
} from "./types";
import { recommendationQuality, summarizeFeedback } from "./feedback";
import { isActionable } from "./confidence";

export function weeklyReview(input: {
  periodStart: string;
  periodEnd: string;
  habits: readonly HabitModel[];
  routines: readonly RoutineModel[];
  metrics: readonly BehavioralMetric[];
  feedback: readonly FeedbackRecord[];
  insights: readonly Insight[];
}): WeeklyReview {
  const achievements: string[] = [];
  const emergingHabits: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];

  for (const h of input.habits) {
    if (h.strength > 0.7 && isActionable(h.confidence))
      achievements.push(`Kept up "${label(h.key)}" (${pct(h.strength)} strength).`);
    else if (h.trend === "rising")
      emergingHabits.push(`"${label(h.key)}" is forming (trend rising).`);
    if (h.breakProbability > 0.5) risks.push(`"${label(h.key)}" is at risk of breaking.`);
  }
  for (const m of input.metrics) {
    if (m.trend === "up") achievements.push(`${m.label} improved to ${m.value}${m.unit}.`);
    if (m.trend === "down") risks.push(`${m.label} declined to ${m.value}${m.unit}.`);
  }
  for (const r of input.routines) {
    if (isActionable(r.confidence))
      opportunities.push(`Lean on your routine: ${r.evidence.detail}.`);
  }
  for (const ins of input.insights.slice(0, 3)) opportunities.push(ins.headline);

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    achievements,
    emergingHabits,
    risks,
    opportunities,
    recommendationQuality: recommendationQuality(input.feedback),
    feedbackSummary: summarizeFeedback(input.feedback),
  };
}

export function monthlyReview(input: {
  periodStart: string;
  periodEnd: string;
  habits: readonly HabitModel[];
  preferences: readonly Preference[];
  metrics: readonly BehavioralMetric[];
  profileMaturity: number;
}): MonthlyReview {
  const longTermTrends: string[] = [];
  for (const m of input.metrics) {
    if (m.trend !== "flat")
      longTermTrends.push(`${m.label} trending ${m.trend} (${m.value}${m.unit}).`);
  }

  const rising = input.habits.filter((h) => h.trend === "rising").length;
  const declining = input.habits.filter((h) => h.trend === "declining").length;
  const focusMetric = input.metrics.find((m) => m.key === "focus_hours");

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    longTermTrends,
    productivityEvolution:
      input.metrics.find((m) => m.key === "task_velocity")?.trend === "up"
        ? "Task velocity is improving month over month."
        : "Task velocity is holding steady.",
    habitEvolution: `${rising} habit(s) strengthening, ${declining} weakening.`,
    focusEvolution: focusMetric
      ? `Focus hours ${focusMetric.trend === "up" ? "increasing" : focusMetric.trend === "down" ? "decreasing" : "stable"} at ${focusMetric.value}${focusMetric.unit}.`
      : "Not enough focus data yet.",
    systemAdaptation: `The OS has learned ${input.preferences.filter((p) => p.enabled).length} preference(s); profile maturity ${pct(input.profileMaturity)}.`,
    metrics: [...input.metrics],
  };
}

function label(key: string): string {
  return key.replace(/[_@:]/g, " ").trim();
}
const pct = (n: number) => `${Math.round(n * 100)}%`;
