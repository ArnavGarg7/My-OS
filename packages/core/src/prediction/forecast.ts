/**
 * Forecast helpers (Sprint 6.2). Shared deterministic math + the Prediction builder every model uses,
 * so each model only expresses its domain logic. Pure — ids/`now` injected, no randomness, no AI.
 */
import type {
  Confidence,
  Prediction,
  PredictionExplanation,
  PredictionKind,
  PredictionOutlook,
  Trend,
} from "./types";

export interface ForecastDeps {
  newId: () => string;
  now: Date;
}

/** Clamp a probability to [0,1] and round to 2dp. */
export function probability(n: number): number {
  return Math.round(Math.max(0, Math.min(1, n)) * 100) / 100;
}

/** Add days to `now` and return an ISO instant. */
export function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

/** Build an immutable Prediction. */
export function makePrediction(
  deps: ForecastDeps,
  input: {
    kind: PredictionKind;
    outlook: PredictionOutlook;
    metrics: Record<string, number>;
    horizonDays: number;
    targetDate?: string | null;
    confidence: Confidence;
    trend?: Trend | null;
    explanation: PredictionExplanation;
    relatedObjects?: { module: string; id: string; label?: string }[];
    subject: string;
  },
): Prediction {
  return {
    id: deps.newId(),
    kind: input.kind,
    outlook: input.outlook,
    metrics: input.metrics,
    horizonDays: input.horizonDays,
    targetDate: input.targetDate ?? null,
    confidence: input.confidence,
    trend: input.trend ?? null,
    explanation: input.explanation,
    relatedObjects: input.relatedObjects ?? [],
    createdAt: deps.now.toISOString(),
    dedupeKey: `${input.kind}:${input.subject}`,
  };
}
