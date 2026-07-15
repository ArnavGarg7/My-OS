/**
 * Calendar schema (Sprint 2.7). The single source of truth for time — events,
 * calendars, availability windows and sync history. Single user
 * (05_Database_Design.md §0: no user_id on domain tables).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const calendarProvider = pgEnum("calendar_provider", [
  "local",
  "google",
  "outlook",
  "apple",
  "ics",
]);

export const calendarEventStatus = pgEnum("calendar_event_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);

export const availabilityType = pgEnum("availability_type", [
  "working",
  "meeting",
  "break",
  "busy",
  "available",
  "focus",
  "personal",
]);

export const syncStatus = pgEnum("sync_status", ["idle", "running", "success", "error"]);

export const calendars = pgTable("calendars", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("blue"),
  provider: calendarProvider("provider").notNull().default("local"),
  primary: boolean("primary").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  syncEnabled: boolean("sync_enabled").notNull().default(false),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  calendarId: uuid("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  location: text("location").notNull().default(""),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  allDay: boolean("all_day").notNull().default(false),
  status: calendarEventStatus("status").notNull().default("confirmed"),
  source: calendarProvider("source").notNull().default("local"),
  recurrenceRule: jsonb("recurrence_rule").$type<Record<string, unknown> | null>(),
  recurrenceParent: uuid("recurrence_parent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const availabilityWindows = pgTable("availability_windows", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekday: integer("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  type: availabilityType("type").notNull().default("working"),
});

export const calendarSyncHistory = pgTable("calendar_sync_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: calendarProvider("provider").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: syncStatus("status").notNull().default("idle"),
  eventsImported: integer("events_imported").notNull().default(0),
  eventsUpdated: integer("events_updated").notNull().default(0),
  eventsDeleted: integer("events_deleted").notNull().default(0),
  error: text("error"),
});

export const calendarsRelations = relations(calendars, ({ many }) => ({
  events: many(calendarEvents),
}));

export type CalendarRow = typeof calendars.$inferSelect;
export type CalendarEventRow = typeof calendarEvents.$inferSelect;
export type AvailabilityWindowRow = typeof availabilityWindows.$inferSelect;
export type CalendarSyncHistoryRow = typeof calendarSyncHistory.$inferSelect;
