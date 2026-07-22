/**
 * Predictive Intelligence Engine schema (Sprint 6.2, Phase 6). Persists the deterministic forecast
 * layer: immutable predictions, the models that produced them, extracted features, confidence,
 * scenario simulations, timelines, and run metrics. Predictions are IMMUTABLE — a new forecast run
 * produces new rows that supersede the old (never an in-place edit). Infrastructure/derived state
 * only; no user business data is owned here and no prediction mutates it. Single user (05 §0).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Immutable predictions. One row per forecast; lifecycle `status` is the only mutable field. */
export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull(),
    outlook: text("outlook").notNull().default("neutral"),
    metrics: jsonb("metrics").$type<Record<string, number>>().notNull().default({}),
    horizonDays: integer("horizon_days").notNull().default(0),
    targetDate: timestamp("target_date", { withTimezone: true }),
    trend: jsonb("trend").$type<Record<string, unknown> | null>(),
    explanation: jsonb("explanation")
      .$type<{
        headline: string;
        calculations: { label: string; value: string }[];
        implication: string;
      }>()
      .notNull(),
    relatedObjects: jsonb("related_objects")
      .$type<{ module: string; id: string; label?: string }[]>()
      .notNull()
      .default([]),
    dedupeKey: text("dedupe_key").notNull(),
    /** active | superseded. */
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byKind: index("predictions_kind_idx").on(t.kind),
    byDedupe: index("predictions_dedupe_idx").on(t.dedupeKey),
  }),
);

/** The forecast models registry (name + version + last run). */
export const predictionModels = pgTable(
  "prediction_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull(),
    version: text("version").notNull().default("1"),
    enabled: boolean("enabled").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKind: index("prediction_models_kind_idx").on(t.kind) }),
);

/** Historical accuracy tracking — a prediction's later realized outcome (for replay/calibration). */
export const predictionHistory = pgTable(
  "prediction_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    predictionId: uuid("prediction_id").notNull(),
    kind: text("kind").notNull(),
    predictedValue: real("predicted_value").notNull().default(0),
    realizedValue: real("realized_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byPrediction: index("prediction_history_prediction_idx").on(t.predictionId) }),
);

/** Deterministic confidence snapshot per prediction. */
export const predictionConfidence = pgTable(
  "prediction_confidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    predictionId: uuid("prediction_id").notNull(),
    level: text("level").notNull().default("low"),
    score: real("score").notNull().default(0),
    reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byPrediction: index("prediction_confidence_prediction_idx").on(t.predictionId) }),
);

/** Scenario simulations (what-if) — never mutate user data. */
export const predictionScenarios = pgTable(
  "prediction_scenarios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    predictionId: uuid("prediction_id"),
    scenario: text("scenario").notNull(),
    effects: jsonb("effects").$type<{ label: string; delta: string }[]>().notNull().default([]),
    netDelta: real("net_delta").notNull().default(0),
    confidence: text("confidence").notNull().default("low"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byPrediction: index("prediction_scenarios_prediction_idx").on(t.predictionId) }),
);

/** Prediction timeline points (past → current → forecast) snapshots. */
export const predictionTimelines = pgTable(
  "prediction_timelines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull(),
    whenBucket: text("when_bucket").notNull().default("forecast"),
    label: text("label").notNull().default(""),
    detail: text("detail").notNull().default(""),
    confidence: text("confidence").notNull().default("low"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byWhen: index("prediction_timelines_when_idx").on(t.whenBucket) }),
);

/** Per-run metrics (how many forecasts, by outlook) for the dashboard. */
export const predictionMetrics = pgTable("prediction_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  total: integer("total").notNull().default(0),
  risks: integer("risks").notNull().default(0),
  opportunities: integer("opportunities").notNull().default(0),
  onTrack: integer("on_track").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Extracted feature snapshots (the numeric inputs a forecast used — for replay/audit). */
export const predictionFeatures = pgTable(
  "prediction_features",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    predictionId: uuid("prediction_id").notNull(),
    features: jsonb("features").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byPrediction: index("prediction_features_prediction_idx").on(t.predictionId) }),
);
