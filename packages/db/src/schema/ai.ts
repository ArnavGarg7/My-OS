/**
 * AI Core Platform schema (Sprint 5.1, Phase 5). These five tables store ONLY platform
 * infrastructure state — never business entities. The AI layer reads the deterministic modules'
 * public read models; it owns no domain data. `ai_memories`, `ai_usage_log` and `ai_actions`
 * referenced by the AI Architecture arrive with their consuming feature sprints; 5.1 ships the
 * platform substrate:
 *
 *   - ai_prompt_versions — the versioned, immutable prompt registry (audit + rollback).
 *   - ai_provider_health — the latest health probe per provider (dashboard + failover).
 *   - ai_eval_runs       — CI evaluation run summaries (regression tracking).
 *   - ai_cache           — deterministic response/embedding cache keyed by content hash.
 *   - ai_stream_sessions — in-flight streaming session state (cancellation, reconnect).
 *
 * Single user (05 §0: no user_id).
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

/** Immutable prompt-version registry. One row per (name, version); never edited in place. */
export const aiPromptVersions = pgTable(
  "ai_prompt_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    version: text("version").notNull(),
    owner: text("owner").notNull().default("platform"),
    /** Frozen prompt text. */
    template: text("template").notNull().default(""),
    compatibleModels: jsonb("compatible_models").$type<string[]>().notNull().default([]),
    outputSchema: text("output_schema"),
    /** Lifecycle metadata (Sprint 5.4). */
    purpose: text("purpose").notNull().default(""),
    requiredTools: jsonb("required_tools").$type<string[]>().notNull().default([]),
    changelog: text("changelog").notNull().default(""),
    /** active | rolled_back | draft. */
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byName: index("ai_prompt_versions_name_idx").on(t.name) }),
);

/** Latest health state per provider (upserted by the health probe). */
export const aiProviderHealth = pgTable(
  "ai_provider_health",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    /** healthy | degraded | unavailable. */
    state: text("state").notNull().default("unavailable"),
    detail: text("detail").notNull().default(""),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProvider: index("ai_provider_health_provider_idx").on(t.provider) }),
);

/** CI evaluation run summaries — one row per suite run, for regression tracking. */
export const aiEvalRuns = pgTable(
  "ai_eval_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    suite: text("suite").notNull(),
    total: integer("total").notNull().default(0),
    passed: integer("passed").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    /** Per-case results snapshot. */
    cases: jsonb("cases")
      .$type<{ name: string; pass: boolean; detail: string }[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySuite: index("ai_eval_runs_suite_idx").on(t.suite) }),
);

/** Deterministic response / embedding cache keyed by content hash (prefix-stable prompts). */
export const aiCache = pgTable(
  "ai_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** FNV hash of the request/content. */
    cacheKey: text("cache_key").notNull(),
    kind: text("kind").notNull().default("response"),
    model: text("model").notNull().default(""),
    value: jsonb("value").notNull(),
    hits: integer("hits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => ({ byKey: index("ai_cache_key_idx").on(t.cacheKey) }),
);

/** In-flight streaming session state — supports cancellation and reconnect. */
export const aiStreamSessions = pgTable(
  "ai_stream_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: text("request_id").notNull(),
    feature: text("feature").notNull().default(""),
    provider: text("provider").notNull().default("local"),
    model: text("model").notNull().default(""),
    /** streaming | done | cancelled | error. */
    status: text("status").notNull().default("streaming"),
    accumulatedChars: integer("accumulated_chars").notNull().default(0),
    cancelled: boolean("cancelled").notNull().default(false),
    latencyMs: real("latency_ms").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => ({ byRequest: index("ai_stream_sessions_request_idx").on(t.requestId) }),
);

/**
 * AI Production Readiness tables (Sprint 5.4). Observability, benchmarking, performance, cost,
 * security and reliability state for the AI Developer Console. Infrastructure only — no business
 * data. Single user (05 §0: no user_id).
 */

/** Offline prompt tests (validation issues per version). */
export const aiPromptTests = pgTable(
  "ai_prompt_tests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    version: text("version").notNull(),
    /** valid | invalid. */
    result: text("result").notNull().default("valid"),
    issues: jsonb("issues").$type<{ code: string; message: string }[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byName: index("ai_prompt_tests_name_idx").on(t.name) }),
);

/** Provider benchmark results — one row per (scenario, provider). */
export const aiProviderBenchmarks = pgTable(
  "ai_provider_benchmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scenarioId: text("scenario_id").notNull(),
    provider: text("provider").notNull(),
    quality: real("quality").notNull().default(0),
    toolAccuracy: real("tool_accuracy").notNull().default(0),
    latencyMs: real("latency_ms").notNull().default(0),
    tokens: integer("tokens").notNull().default(0),
    costUsd: real("cost_usd").notNull().default(0),
    recommended: boolean("recommended").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byScenario: index("ai_provider_benchmarks_scenario_idx").on(t.scenarioId) }),
);

/** Per-stage latency samples for performance budgets. */
export const aiPerformanceMetrics = pgTable(
  "ai_performance_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stage: text("stage").notNull(),
    feature: text("feature").notNull().default(""),
    ms: real("ms").notNull().default(0),
    /** Whether this sample breached its budget. */
    breached: boolean("breached").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byStage: index("ai_performance_metrics_stage_idx").on(t.stage) }),
);

/** Replayable execution traces — one per AI request. */
export const aiExecutionTraces = pgTable(
  "ai_execution_traces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    traceId: text("trace_id").notNull(),
    conversationId: uuid("conversation_id"),
    feature: text("feature").notNull().default(""),
    provider: text("provider").notNull().default("local"),
    promptVersion: text("prompt_version"),
    contextBuilders: jsonb("context_builders").$type<string[]>().notNull().default([]),
    toolCalls: jsonb("tool_calls").$type<unknown[]>().notNull().default([]),
    memoryRetrieved: jsonb("memory_retrieved").$type<string[]>().notNull().default([]),
    latencies: jsonb("latencies").$type<Record<string, number>>().notNull().default({}),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    fallbacks: jsonb("fallbacks").$type<unknown[]>().notNull().default([]),
    grounded: boolean("grounded").notNull().default(false),
    status: text("status").notNull().default("ok"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byTrace: index("ai_execution_traces_trace_idx").on(t.traceId) }),
);

/** Rolled-up cost metrics per provider/feature per day. */
export const aiCostMetrics = pgTable(
  "ai_cost_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    day: text("day").notNull(),
    provider: text("provider").notNull().default("local"),
    feature: text("feature").notNull().default(""),
    requests: integer("requests").notNull().default(0),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsd: real("cost_usd").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byDay: index("ai_cost_metrics_day_idx").on(t.day) }),
);

/** Security events — injection scans, permission denials, credential-format failures. */
export const aiSecurityEvents = pgTable(
  "ai_security_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** injection | permission_denied | credential_invalid | secret_gap. */
    kind: text("kind").notNull(),
    severity: text("severity").notNull().default("info"),
    detail: text("detail").notNull().default(""),
    /** Never contains secret values. */
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKind: index("ai_security_events_kind_idx").on(t.kind) }),
);

/** Reliability events — failures encountered and how they recovered. */
export const aiReliabilityEvents = pgTable(
  "ai_reliability_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull(),
    recovered: boolean("recovered").notNull().default(true),
    finalProvider: text("final_provider").notNull().default("local"),
    attempts: integer("attempts").notNull().default(0),
    actionsTaken: jsonb("actions_taken").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKind: index("ai_reliability_events_kind_idx").on(t.kind) }),
);
