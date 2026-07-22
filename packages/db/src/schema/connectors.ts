/**
 * Connector Platform schema (Sprint 6.4, Phase 6). Persists external-service connections and the
 * normalized events they emit: providers (registry snapshot), accounts (a user's connections),
 * ENCRYPTED credentials, sync jobs/history/checkpoints, immutable normalized events, health, rate
 * limits, webhooks, permissions and metrics. **Credentials are AES-256-GCM ciphertext, server-side
 * only, never returned through the API and never reachable by the AI.** Connectors own no business
 * data — only sync state + normalized events. Single user (05 §0).
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

/** Registry snapshot — one row per available provider. */
export const connectorProviders = pgTable(
  "connector_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerKey: text("provider_key").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    auth: text("auth").notNull().default("oauth2"),
    supportedEvents: jsonb("supported_events").$type<string[]>().notNull().default([]),
    syncStrategy: text("sync_strategy").notNull().default("polling"),
    version: text("version").notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("connector_providers_key_idx").on(t.providerKey) }),
);

/** A user's connection to a provider (an account). `state` is the lifecycle. */
export const connectorAccounts = pgTable(
  "connector_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerKey: text("provider_key").notNull(),
    label: text("label").notNull().default(""),
    state: text("state").notNull().default("disconnected"),
    checkpoint: text("checkpoint"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProvider: index("connector_accounts_provider_idx").on(t.providerKey) }),
);

/** ENCRYPTED credentials (AES-256-GCM). Never returned, never sent to AI. */
export const connectorCredentials = pgTable(
  "connector_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull(),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    tag: text("tag").notNull(),
    /** A non-secret hint (e.g. "•••4821") for display. */
    hint: text("hint").notNull().default(""),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byAccount: index("connector_credentials_account_idx").on(t.accountId) }),
);

/** Scheduled sync jobs. */
export const connectorSyncJobs = pgTable(
  "connector_sync_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull(),
    mode: text("mode").notNull().default("incremental"),
    trigger: text("trigger").notNull().default("manual"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byAccount: index("connector_sync_jobs_account_idx").on(t.accountId) }),
);

/** Immutable sync run history. */
export const connectorSyncHistory = pgTable(
  "connector_sync_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull(),
    eventsProcessed: integer("events_processed").notNull().default(0),
    dropped: integer("dropped").notNull().default(0),
    durationMs: real("duration_ms").notNull().default(0),
    ok: boolean("ok").notNull().default(true),
    checkpoint: text("checkpoint"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byAccount: index("connector_sync_history_account_idx").on(t.accountId) }),
);

/** Immutable normalized events emitted by connectors (the bridge to the Event Engine). */
export const connectorEvents = pgTable(
  "connector_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull(),
    providerKey: text("provider_key").notNull(),
    kind: text("kind").notNull(),
    externalId: text("external_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byAccount: index("connector_events_account_idx").on(t.accountId),
    byKind: index("connector_events_kind_idx").on(t.kind),
  }),
);

/** Health snapshots per account. */
export const connectorHealth = pgTable(
  "connector_health",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull(),
    state: text("state").notNull().default("disconnected"),
    score: integer("score").notNull().default(0),
    latencyMs: real("latency_ms").notNull().default(0),
    syncAgeMinutes: integer("sync_age_minutes").notNull().default(0),
    failures: integer("failures").notNull().default(0),
    rateLimited: boolean("rate_limited").notNull().default(false),
    reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byAccount: index("connector_health_account_idx").on(t.accountId) }),
);

/** Rate-limit tracking per account. */
export const connectorRateLimits = pgTable("connector_rate_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  remaining: integer("remaining").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Registered webhooks per account. */
export const connectorWebhooks = pgTable("connector_webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  endpoint: text("endpoint").notNull().default(""),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Sync checkpoints (resumable). */
export const connectorCheckpoints = pgTable(
  "connector_checkpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull(),
    checkpoint: text("checkpoint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byAccount: index("connector_checkpoints_account_idx").on(t.accountId) }),
);

/** Granted permission scopes per account (reference). */
export const connectorPermissions = pgTable("connector_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  permission: text("permission").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Per-account metrics snapshot. */
export const connectorMetrics = pgTable("connector_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  syncs: integer("syncs").notNull().default(0),
  eventsProcessed: integer("events_processed").notNull().default(0),
  failures: integer("failures").notNull().default(0),
  retries: integer("retries").notNull().default(0),
  avgSyncMs: real("avg_sync_ms").notNull().default(0),
  rateLimitHits: integer("rate_limit_hits").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
