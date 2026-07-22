/**
 * Prediction selectors (Sprint 6.2). Pure read-model views over predictions for the server's
 * `prediction.*` endpoints and the Chief. No IO.
 */
import type { Prediction, PredictionKind } from "./types";

/** Predictions of a given kind. */
export function byKind(predictions: readonly Prediction[], kind: PredictionKind): Prediction[] {
  return predictions.filter((p) => p.kind === kind);
}

/** At-risk forecasts, most-confident first. */
export function riskForecasts(predictions: readonly Prediction[]): Prediction[] {
  return predictions
    .filter((p) => p.outlook === "at_risk")
    .sort((a, b) => b.confidence.score - a.confidence.score);
}

/** Opportunity forecasts, most-confident first. */
export function opportunityForecasts(predictions: readonly Prediction[]): Prediction[] {
  return predictions
    .filter((p) => p.outlook === "opportunity")
    .sort((a, b) => b.confidence.score - a.confidence.score);
}

/** The forecasts the Chief should weigh (actionable + confident), highest-confidence first. */
export function chiefForecasts(predictions: readonly Prediction[], limit = 6): Prediction[] {
  return predictions
    .filter(
      (p) => (p.outlook === "at_risk" || p.outlook === "opportunity") && p.confidence.score >= 0.4,
    )
    .sort((a, b) => b.confidence.score - a.confidence.score)
    .slice(0, limit);
}

/** Summary counts for a badge / status bar. */
export function forecastCounts(predictions: readonly Prediction[]): {
  total: number;
  risks: number;
  opportunities: number;
  onTrack: number;
} {
  return {
    total: predictions.length,
    risks: predictions.filter((p) => p.outlook === "at_risk").length,
    opportunities: predictions.filter((p) => p.outlook === "opportunity").length,
    onTrack: predictions.filter((p) => p.outlook === "on_track").length,
  };
}
