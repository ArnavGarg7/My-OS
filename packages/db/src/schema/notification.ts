/**
 * Notification engine schema (Sprint 3.3). The Notification Engine is a PLATFORM
 * engine — it stores notifications, their queued deliveries, per-category preferences
 * and an append-only history. It holds no feature data; every notification references
 * a source module + condition and carries an automation-ready trigger/payload.
 * Single user (05 §0).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const notificationType = pgEnum("notification_type", [
  "reminder",
  "alert",
  "information",
  "warning",
  "success",
  "system",
  "health",
  "calendar",
  "planner",
  "finance",
  "goals",
  "projects",
  "focus",
]);

export const notificationPriority = pgEnum("notification_priority", [
  "critical",
  "high",
  "medium",
  "low",
  "silent",
]);

export const notificationStatus = pgEnum("notification_status", [
  "generated",
  "scheduled",
  "delivered",
  "seen",
  "snoozed",
  "completed",
  "archived",
  "dismissed",
  "cancelled",
  "expired",
]);

export const deliveryChannel = pgEnum("delivery_channel", [
  "banner",
  "toast",
  "persistent",
  "silent",
  "desktop",
  "push",
  "sound",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: notificationType("type").notNull(),
    priority: notificationPriority("priority").notNull().default("medium"),
    status: notificationStatus("status").notNull().default("generated"),
    title: text("title").notNull(),
    reason: text("reason").notNull().default(""),
    source: text("source").notNull(),
    /** Stable key identifying the underlying condition (deduplication). */
    dedupeKey: text("dedupe_key").notNull(),
    /** Automation-ready descriptors. */
    trigger: text("trigger").notNull().default(""),
    condition: text("condition").notNull().default(""),
    payload: jsonb("payload").notNull().default({}),
    sourceHref: text("source_href"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    seenAt: timestamp("seen_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    snoozeCount: integer("snooze_count").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    channels: jsonb("channels").notNull().default([]),
    escalation: text("escalation").notNull().default("silent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byStatus: index("notifications_status_idx").on(t.status),
    byDedupe: index("notifications_dedupe_idx").on(t.dedupeKey),
    bySource: index("notifications_source_idx").on(t.source),
  }),
);

/** The delivery queue — notifications scheduled/delayed for a future deliver time. */
export const notificationQueue = pgTable(
  "notification_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    deliverAt: timestamp("deliver_at", { withTimezone: true }).notNull(),
    reason: text("reason").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byDeliverAt: index("notification_queue_deliver_idx").on(t.deliverAt) }),
);

/** Single-row (per user) preferences. Categories stored as JSON for simplicity. */
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(true),
  quietHoursStart: text("quiet_hours_start").notNull().default("22:00"),
  quietHoursEnd: text("quiet_hours_end").notNull().default("07:00"),
  workingHoursOnly: boolean("working_hours_only").notNull().default(false),
  weekendSuppression: boolean("weekend_suppression").notNull().default(false),
  muted: boolean("muted").notNull().default(false),
  /** Per-category preferences (array of CategoryPreference). */
  categories: jsonb("categories").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only lifecycle history. */
export const notificationHistory = pgTable(
  "notification_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    status: notificationStatus("status").notNull(),
    note: text("note"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byNotification: index("notification_history_notif_idx").on(t.notificationId) }),
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationQueueRow = typeof notificationQueue.$inferSelect;
export type NotificationPreferencesRow = typeof notificationPreferences.$inferSelect;
export type NotificationHistoryRow = typeof notificationHistory.$inferSelect;
