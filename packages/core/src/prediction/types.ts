/**
 * Predictive Intelligence Engine — types (Sprint 6.2, Phase 6). The deterministic layer that
 * forecasts likely futures from historical read models. Pure: no IO, no clock (time is passed in),
 * no randomness, **no AI** — the OS predicts; the AI only explains. Predictions are IMMUTABLE and
 * never modify data or trigger automations.
 *
 * Pipeline: historical read models → feature extraction → trend → forecast model → confidence →
 * Prediction → (bridge) Prediction Signal → the 6.1 Signal Engine.
 */

/** The forecast domains (spec §Forecast Models). */
export type PredictionKind =
  "goal" | "deadline" | "schedule" | "workload" | "study" | "project" | "health" | "habit";

/** What the prediction implies for the user. */
export type PredictionOutlook = "on_track" | "at_risk" | "opportunity" | "neutral";

/** Deterministic confidence bands (spec §Confidence Engine). */
export type ConfidenceLevel = "very_high" | "high" | "medium" | "low";

/** Trend direction over the observed window. */
export type TrendDirection = "rising" | "falling" | "flat";

/** A computed trend with its supporting numbers (spec §Trend Analysis). Explainable. */
export interface Trend {
  metric: string;
  direction: TrendDirection;
  /** Per-period change (slope of the fit line). */
  slope: number;
  /** Latest moving-average value. */
  movingAverage: number;
  /** Number of historical points the trend is based on. */
  samples: number;
}

/** The deterministic confidence of a prediction + why. */
export interface Confidence {
  level: ConfidenceLevel;
  /** 0..1 composite. */
  score: number;
  reasons: string[];
}

/** A structured justification: the calculations behind the forecast (spec §Explainable Predictions). */
export interface PredictionExplanation {
  headline: string;
  /** Label → value pairs, e.g. "Average completion velocity" → "2.4 tasks/day". */
  calculations: { label: string; value: string }[];
  implication: string;
}

/**
 * An immutable prediction. Deterministic given its inputs. A new forecast run produces new
 * predictions (superseding old ones) — a prediction is never edited in place.
 */
export interface Prediction {
  id: string;
  kind: PredictionKind;
  outlook: PredictionOutlook;
  /** The headline forecast value, model-specific (e.g. probability 0..1, or days). */
  metrics: Record<string, number>;
  /** Forecast horizon in days from `createdAt`. */
  horizonDays: number;
  /** ISO instant the forecast targets (e.g. expected finish). Null when not a date forecast. */
  targetDate: string | null;
  confidence: Confidence;
  trend: Trend | null;
  explanation: PredictionExplanation;
  relatedObjects: { module: string; id: string; label?: string }[];
  createdAt: string;
  /** Stable key: kind + subject (for supersession/replay). */
  dedupeKey: string;
}

/** A prediction rendered as one timeline point (past / current / forecast). */
export interface PredictionTimelinePoint {
  at: string;
  when: "past" | "current" | "forecast";
  label: string;
  detail: string;
  confidence: ConfidenceLevel;
}

/** A scenario simulation result (spec §Scenario Simulation) — never mutates anything. */
export interface ScenarioResult {
  scenario: string;
  /** Ordered effect lines ("Focus increases", "Schedule pressure unchanged"). */
  effects: { label: string; delta: string }[];
  /** The net change to the headline metric (e.g. completion probability +0.06). */
  netDelta: number;
  confidence: ConfidenceLevel;
}
