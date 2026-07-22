/**
 * Event Intelligence Engine schema (Sprint 6.1, Phase 6). Persists the deterministic signal layer:
 * events observed, immutable signals generated, their rankings, timeline (replay/audit), watcher +
 * subscription config, notification decisions, and context-window membership. Signals are IMMUTABLE
 * — a change in the world produces a new signal that supersedes the old (never an in-place edit).
 * Infrastructure/derived state only; no user business data is owned here. Single user (05 §0).
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

/** Normalized events the watchers publish onto the bus. */
export const signalEvents = pgTable(
  "signal_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    kind: text("kind").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    refModule: text("ref_module"),
    refId: text("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySource: index("signal_events_source_idx").on(t.source) }),
);

/** Immutable signals. One row per generated signal; never updated except the lifecycle `status`. */
export const signals = pgTable(
  "signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    category: text("category").notNull(),
    severity: text("severity").notNull().default("info"),
    confidence: real("confidence").notNull().default(0),
    window: text("window").notNull().default("current"),
    /** active | expired | superseded | acknowledged. */
    status: text("status").notNull().default("active"),
    dedupeKey: text("dedupe_key").notNull(),
    explanation: jsonb("explanation")
      .$type<{ headline: string; reasons: string[]; implication: string }>()
      .notNull(),
    relatedObjects: jsonb("related_objects")
      .$type<{ module: string; id: string; label?: string }[]>()
      .notNull()
      .default([]),
    eventIds: jsonb("event_ids").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => ({
    byStatus: index("signals_status_idx").on(t.status),
    byDedupe: index("signals_dedupe_idx").on(t.dedupeKey),
  }),
);

/** Deterministic ranking snapshot per signal (importance/urgency/…/priority). */
export const signalRankings = pgTable(
  "signal_rankings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    signalId: uuid("signal_id").notNull(),
    importance: real("importance").notNull().default(0),
    urgency: real("urgency").notNull().default(0),
    confidence: real("confidence").notNull().default(0),
    recency: real("recency").notNull().default(0),
    impact: real("impact").notNull().default(0),
    priority: real("priority").notNull().default(0),
    rankedAt: timestamp("ranked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySignal: index("signal_rankings_signal_idx").on(t.signalId) }),
);

/** Append-only audit/replay trail for a signal's lifecycle. */
export const signalTimeline = pgTable(
  "signal_timeline",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    signalId: text("signal_id").notNull(),
    kind: text("kind").notNull(),
    detail: text("detail").notNull().default(""),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySignal: index("signal_timeline_signal_idx").on(t.signalId) }),
);

/** Per-module watcher registration + last-run bookkeeping. */
export const signalWatchers = pgTable(
  "signal_watchers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    module: text("module").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    eventsEmitted: integer("events_emitted").notNull().default(0),
  },
  (t) => ({ byModule: index("signal_watchers_module_idx").on(t.module) }),
);

/** The user's signal subscription preferences (which categories, minimum level). */
export const signalSubscriptions = pgTable("signal_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  minLevel: text("min_level").notNull().default("suggestion"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Notification decisions taken for signals (what level, whether surfaced). */
export const signalNotifications = pgTable(
  "signal_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    signalId: uuid("signal_id").notNull(),
    level: text("level").notNull().default("silent"),
    surfaced: boolean("surfaced").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySignal: index("signal_notifications_signal_idx").on(t.signalId) }),
);

/** Context-window membership snapshots (for the dashboard's window grouping). */
export const signalContextWindows = pgTable(
  "signal_context_windows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    signalId: uuid("signal_id").notNull(),
    window: text("window").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byWindow: index("signal_context_windows_window_idx").on(t.window) }),
);
