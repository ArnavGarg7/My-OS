/**
 * Timeline schema (Sprint 2.13). The immutable, append-only historical backbone.
 * `timeline_events` is a unified read model referencing each module's entities
 * (never owning them); daily/period rollups + pinned memories are derived and
 * persisted for fast reads. No user_id (single user, 05 §0).
 */
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const timelineSource = pgEnum("timeline_source", [
  "today",
  "decision",
  "planner",
  "calendar",
  "task",
  "project",
  "goal",
  "journal",
  "health",
  "finance",
  "inbox",
  "automation",
  "orchestration",
  "ai",
]);

export const memoryType = pgEnum("memory_type", [
  "achievement",
  "milestone",
  "reflection",
  "health",
  "finance",
  "learning",
  "personal",
]);

export const snapshotType = pgEnum("snapshot_type", ["week", "month", "quarter", "year"]);

export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventType: text("event_type").notNull(),
    sourceModule: timelineSource("source_module").notNull(),
    entityId: text("entity_id"),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    importance: integer("importance").notNull().default(40),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byTimestamp: index("timeline_events_timestamp_idx").on(t.timestamp),
    bySource: index("timeline_events_source_idx").on(t.sourceModule),
    byEntity: index("timeline_events_entity_idx").on(t.entityId),
  }),
);

/** Daily aggregated snapshot (derived; one row per calendar day). */
export const timelineDays = pgTable("timeline_days", {
  date: date("date", { mode: "string" }).primaryKey(),
  eventCount: integer("event_count").notNull().default(0),
  completionScore: integer("completion_score").notNull().default(0),
  focusMinutes: integer("focus_minutes").notNull().default(0),
  healthScore: integer("health_score").notNull().default(0),
  journalWritten: boolean("journal_written").notNull().default(false),
  plannerAccuracy: integer("planner_accuracy").notNull().default(0),
});

/** Pinned / promoted memories, each referencing a source event. */
export const timelineMemories = pgTable(
  "timeline_memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => timelineEvents.id, { onDelete: "cascade" }),
    memoryType: memoryType("memory_type").notNull().default("milestone"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    pinned: boolean("pinned").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byEvent: index("timeline_memories_event_idx").on(t.eventId) }),
);

/** Weekly / monthly / quarterly / yearly rollups. */
export const timelineSnapshots = pgTable("timeline_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  snapshotType: snapshotType("snapshot_type").notNull(),
  periodStart: date("period_start", { mode: "string" }).notNull(),
  periodEnd: date("period_end", { mode: "string" }).notNull(),
  summary: text("summary").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TimelineEventRow = typeof timelineEvents.$inferSelect;
export type TimelineEventInsertRow = typeof timelineEvents.$inferInsert;
export type TimelineDayRow = typeof timelineDays.$inferSelect;
export type TimelineMemoryRow = typeof timelineMemories.$inferSelect;
export type TimelineSnapshotRow = typeof timelineSnapshots.$inferSelect;
