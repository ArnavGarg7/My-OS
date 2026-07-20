/**
 * AI Chief of Staff schema (Sprint 5.2, Phase 5). Stores ONLY Chief interaction state + config —
 * never business data (the Chief reads the deterministic modules' public read models and owns no
 * domain entities). Five tables:
 *
 *   - chief_sessions        — one row per "what should I do?" interaction (context hash + outcome).
 *   - chief_recommendations — the recommendation shown (action + confidence + explanation snapshot).
 *   - chief_feedback        — accepted/modified/rejected/ignored per recommendation (learning input).
 *   - ai_provider_policies  — per-capability provider preference overrides (config).
 *   - personal_ai_profiles  — the user-editable Personal AI Profile (distinct from ai_memories).
 *
 * Single user (05 §0: no user_id).
 */
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** One Chief interaction — the context it saw (hashed) and what capability/provider served it. */
export const chiefSessions = pgTable(
  "chief_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** now | morning | optimize | rescue | night. */
    kind: text("kind").notNull().default("now"),
    /** FNV hash of the ChiefContext, for dedup + reproducibility. */
    contextHash: text("context_hash").notNull().default(""),
    provider: text("provider").notNull().default("local"),
    capability: text("capability").notNull().default("reasoning"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKind: index("chief_sessions_kind_idx").on(t.kind) }),
);

/** A recommendation the Chief produced. Immutable snapshot — history, never recomputed. */
export const chiefRecommendations = pgTable(
  "chief_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => chiefSessions.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    title: text("title").notNull().default(""),
    confidence: text("confidence").notNull().default("medium"),
    /** The structured explanation (situation/recommendation/alternatives/cost). */
    explanation: jsonb("explanation").notNull(),
    /** Reference to the target entity, if any: { module, id }. */
    entityRef: jsonb("entity_ref").$type<{ module: string; id: string } | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySession: index("chief_recommendations_session_idx").on(t.sessionId) }),
);

/** Feedback on a recommendation — the learning signal (never alters deterministic logic). */
export const chiefFeedback = pgTable(
  "chief_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recommendationId: uuid("recommendation_id").references(() => chiefRecommendations.id, {
      onDelete: "cascade",
    }),
    /** accepted | modified | rejected | ignored. */
    outcome: text("outcome").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byRecommendation: index("chief_feedback_recommendation_idx").on(t.recommendationId) }),
);

/** Per-capability provider preference overrides (config only). */
export const aiProviderPolicies = pgTable(
  "ai_provider_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** reasoning | fast | planning | summaries | offline. */
    capability: text("capability").notNull(),
    /** Ordered provider names, highest preference first. */
    providerOrder: jsonb("provider_order").$type<string[]>().notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byCapability: index("ai_provider_policies_capability_idx").on(t.capability) }),
);

/** The Personal AI Profile — user-editable preferences, distinct from ai_memories. One row. */
export const personalAiProfiles = pgTable("personal_ai_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  deepWorkPreferredStartHour: integer("deep_work_preferred_start_hour").notNull().default(9),
  deepWorkMinBlockMinutes: integer("deep_work_min_block_minutes").notNull().default(50),
  studyPreferredStartHour: integer("study_preferred_start_hour").notNull().default(16),
  workoutPreferredHour: integer("workout_preferred_hour").notNull().default(18),
  meetingPreference: text("meeting_preference").notNull().default("batch"),
  planningStyle: text("planning_style").notNull().default("flexible"),
  communicationStyle: text("communication_style").notNull().default("concise"),
  notificationStyle: text("notification_style").notNull().default("proactive"),
  breakFrequencyMinutes: integer("break_frequency_minutes").notNull().default(50),
  reviewStyle: text("review_style").notNull().default("daily"),
  decisionStyle: text("decision_style").notNull().default("fast"),
  revision: integer("revision").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
