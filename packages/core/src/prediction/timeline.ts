/**
 * Prediction Timeline (Sprint 6.2, spec §Prediction Timeline). Lays predictions out on a Past →
 * Current → Forecast axis so the user sees where momentum is heading. Pure.
 */
import type { Prediction, PredictionTimelinePoint } from "./types";

/** Build an ordered timeline (current "now" anchor + one forecast point per prediction). */
export function buildPredictionTimeline(
  predictions: readonly Prediction[],
  now: Date,
): PredictionTimelinePoint[] {
  const points: PredictionTimelinePoint[] = [
    {
      at: now.toISOString(),
      when: "current",
      label: "Now",
      detail: `${predictions.length} active forecast${predictions.length === 1 ? "" : "s"}`,
      confidence: "very_high",
    },
  ];
  for (const p of predictions) {
    points.push({
      at: p.targetDate ?? new Date(now.getTime() + p.horizonDays * 86_400_000).toISOString(),
      when: "forecast",
      label: p.explanation.headline,
      detail: `${p.kind} · ${p.outlook.replace("_", " ")}`,
      confidence: p.confidence.level,
    });
  }
  return points.sort((a, b) => a.at.localeCompare(b.at));
}
