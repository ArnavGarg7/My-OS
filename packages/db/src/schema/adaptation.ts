/**
 * Adaptive Personal Intelligence schema (Sprint 6.5, Phase 6 finale). Persists the deterministic
 * Personal Profile the OS builds from long-term observation: versioned profile fields, learned
 * preferences (user-editable/disableable), habit + routine models, behavioral metrics, the immutable
 * adaptation event log, recommendation feedback, per-category learning policies, confidence snapshots,
 * weekly/monthly reviews and personal insights. Every learned value carries confidence + evidence +
 * version. **Sensitive**: this is a model of the user. NO AI writes here — the OS learns
 * deterministically; AI only reads/explains. Nothing here mutates other modules' data. Single user.
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

/** Versioned profile fields (one row per learned field, per category). */
export const personalProfiles = pgTable(
  "personal_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fieldKey: text("field_key").notNull(),
    category: text("category").notNull(),
    value: text("value").notNull(),
    confidenceLevel: text("confidence_level").notNull().default("unknown"),
    confidenceScore: real("confidence_score").notNull().default(0),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
    version: integer("version").notNull().default(1),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("personal_profiles_key_idx").on(t.fieldKey) }),
);

/** Learned preferences — editable + disableable by the user. */
export const personalPreferences = pgTable(
  "personal_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prefKey: text("pref_key").notNull(),
    category: text("category").notNull(),
    value: text("value").notNull(),
    source: text("source").notNull().default("implicit"),
    confidenceLevel: text("confidence_level").notNull().default("unknown"),
    confidenceScore: real("confidence_score").notNull().default(0),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("personal_preferences_key_idx").on(t.prefKey) }),
);

/** Habit models (read-only intelligence — never modify habits). */
export const habitModels = pgTable(
  "habit_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    habitKey: text("habit_key").notNull(),
    strength: real("strength").notNull().default(0),
    consistency: real("consistency").notNull().default(0),
    trend: text("trend").notNull().default("steady"),
    breakProbability: real("break_probability").notNull().default(0),
    recoveryRate: real("recovery_rate").notNull().default(0),
    confidenceLevel: text("confidence_level").notNull().default("unknown"),
    confidenceScore: real("confidence_score").notNull().default(0),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("habit_models_key_idx").on(t.habitKey) }),
);

/** Discovered recurring routines. */
export const routineModels = pgTable(
  "routine_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineKey: text("routine_key").notNull(),
    label: text("label").notNull(),
    dayOfWeek: integer("day_of_week"),
    hour: integer("hour"),
    occurrences: integer("occurrences").notNull().default(0),
    confidenceLevel: text("confidence_level").notNull().default("unknown"),
    confidenceScore: real("confidence_score").notNull().default(0),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("routine_models_key_idx").on(t.routineKey) }),
);

/** Behavioral metric snapshots. */
export const behavioralMetrics = pgTable(
  "behavioral_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    metricKey: text("metric_key").notNull(),
    label: text("label").notNull(),
    value: real("value").notNull().default(0),
    unit: text("unit").notNull().default(""),
    trend: text("trend").notNull().default("flat"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("behavioral_metrics_key_idx").on(t.metricKey) }),
);

/** Immutable adaptation event log (audit trail — every learn/update/disable/feedback). */
export const adaptationEvents = pgTable(
  "adaptation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull(),
    subject: text("subject").notNull(),
    detail: text("detail").notNull().default(""),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKind: index("adaptation_events_kind_idx").on(t.kind) }),
);

/** Recommendation feedback (drives deterministic personalization weights). */
export const recommendationFeedback = pgTable(
  "recommendation_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: text("proposal_id").notNull(),
    subject: text("subject").notNull(),
    type: text("type").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySubject: index("recommendation_feedback_subject_idx").on(t.subject) }),
);

/** Per-category learning policies (manual/suggested/automatic; sensitive never automatic). */
export const adaptationPolicies = pgTable("adaptation_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  mode: text("mode").notNull().default("suggested"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Confidence snapshots (auditability of how confident the OS was over time). */
export const adaptationConfidence = pgTable("adaptation_confidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  subject: text("subject").notNull(),
  level: text("level").notNull().default("unknown"),
  score: real("score").notNull().default(0),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

/** Generated weekly intelligence reviews (reproducible from history). Table name is domain-prefixed to
 *  avoid colliding with the Analytics engine's `weekly_reviews` (Sprint 2.14). */
export const adaptationWeeklyReviews = pgTable("adaptation_weekly_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Generated monthly intelligence reviews. Domain-prefixed (see above). */
export const adaptationMonthlyReviews = pgTable("adaptation_monthly_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Explainable personal insights. */
export const personalInsights = pgTable(
  "personal_insights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: text("category").notNull(),
    headline: text("headline").notNull(),
    detail: text("detail").notNull().default(""),
    confidenceLevel: text("confidence_level").notNull().default("unknown"),
    confidenceScore: real("confidence_score").notNull().default(0),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byCategory: index("personal_insights_category_idx").on(t.category) }),
);
