/**
 * Insight Engine (Sprint 6.5, spec §Insight Engine). Turns strong learned preferences / habits /
 * routines / metrics into explainable, evidence-backed insights (e.g. "You complete programming tasks
 * 24% faster between 8:30–11:00 AM"). Pure — no AI, no generative storytelling; every insight is a
 * deterministic template filled from the profile + its evidence. Only sufficiently-confident inputs
 * become insights (the OS never guesses).
 */
import type {
  AdaptationDeps,
  BehavioralMetric,
  HabitModel,
  Insight,
  Preference,
  RoutineModel,
} from "./types";
import { isActionable } from "./confidence";

/** Generate insights from the learned models. Only actionable-confidence items surface. */
export function generateInsights(
  input: {
    preferences: readonly Preference[];
    habits: readonly HabitModel[];
    routines: readonly RoutineModel[];
    metrics: readonly BehavioralMetric[];
  },
  deps: AdaptationDeps,
): Insight[] {
  const insights: Insight[] = [];

  for (const p of input.preferences) {
    if (!p.enabled || !isActionable(p.confidence)) continue;
    insights.push({
      id: deps.newId(),
      category: p.category,
      headline: `Preferred ${humanize(p.key)}: ${p.value}`,
      detail: `You consistently choose "${p.value}" for ${humanize(p.key)}. ${p.evidence.detail}.`,
      confidence: p.confidence,
      evidence: p.evidence,
    });
  }

  for (const h of input.habits) {
    if (!isActionable(h.confidence)) continue;
    if (h.trend === "declining" || h.breakProbability > 0.5) {
      insights.push({
        id: deps.newId(),
        category: "health",
        headline: `Habit at risk: ${humanize(h.key)}`,
        detail: `"${humanize(h.key)}" is ${h.trend} (strength ${pct(h.strength)}, break risk ${pct(h.breakProbability)}). ${h.evidence.detail}.`,
        confidence: h.confidence,
        evidence: h.evidence,
      });
    } else if (h.strength > 0.7) {
      insights.push({
        id: deps.newId(),
        category: "health",
        headline: `Strong habit: ${humanize(h.key)}`,
        detail: `"${humanize(h.key)}" is well-established (strength ${pct(h.strength)}, consistency ${pct(h.consistency)}). ${h.evidence.detail}.`,
        confidence: h.confidence,
        evidence: h.evidence,
      });
    }
  }

  for (const r of input.routines) {
    if (!isActionable(r.confidence)) continue;
    insights.push({
      id: deps.newId(),
      category: "planning",
      headline: `Routine: ${humanize(r.label)}`,
      detail: r.evidence.detail,
      confidence: r.confidence,
      evidence: r.evidence,
    });
  }

  for (const m of input.metrics) {
    if (m.trend === "flat") continue;
    insights.push({
      id: deps.newId(),
      category: "productivity",
      headline: `${m.label} is trending ${m.trend}`,
      detail: `Your ${m.label.toLowerCase()} is ${m.value}${m.unit} and ${m.trend === "up" ? "rising" : "falling"}.`,
      confidence: {
        level: "medium",
        score: 0.5,
        reasons: ["derived from recent behavioral metrics"],
      },
      evidence: {
        observations: 0,
        timeSpanDays: 0,
        source: "implicit",
        detail: `${m.label}: ${m.value}${m.unit}`,
      },
    });
  }

  return insights.sort((a, b) => b.confidence.score - a.confidence.score);
}

function humanize(key: string): string {
  return key.replace(/[_@:]/g, " ").replace(/\s+/g, " ").trim();
}
const pct = (n: number) => `${Math.round(n * 100)}%`;
