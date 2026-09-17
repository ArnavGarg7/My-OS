/**
 * Platform schema (Sprint 1.7) — docs/specs/05_Database_Design.md §1 (push_subscriptions).
 *
 * Stores Web Push subscriptions per device so a future server-side push sender
 * can target them. This sprint only stores/registers them — there is no sender
 * and no scheduling.
 */
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "./identity";

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(authUsers, {
    fields: [pushSubscriptions.userId],
    references: [authUsers.id],
  }),
}));

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscriptionRow = typeof pushSubscriptions.$inferInsert;

/**
 * Native push device tokens (Stage D). Distinct transport from Web Push above: a native
 * Capacitor app registers a single opaque FCM registration token per device (not the W3C
 * endpoint/p256dh/auth triple), and the server-side FCM HTTP v1 sender targets these so the
 * OS can notify a device even when the app is closed. Keyed by token (a device re-registers
 * with the same or a rotated token); stale tokens are pruned on an FCM UNREGISTERED response.
 */
export const pushDevices = pgTable("push_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull().default("android"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushDevicesRelations = relations(pushDevices, ({ one }) => ({
  user: one(authUsers, {
    fields: [pushDevices.userId],
    references: [authUsers.id],
  }),
}));

export type PushDeviceRow = typeof pushDevices.$inferSelect;
export type NewPushDeviceRow = typeof pushDevices.$inferInsert;
