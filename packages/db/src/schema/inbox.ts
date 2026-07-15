/**
 * Universal Inbox schema (Sprint 2.4). The Inbox is the single capture surface
 * for the whole OS — every piece of incoming information lands here first and
 * nothing is auto-categorized. Single user (05_Database_Design.md §0: no
 * user_id on domain tables).
 */
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const captureType = pgEnum("capture_type", [
  "text",
  "task",
  "note",
  "idea",
  "decision_note",
  "meeting",
  "url",
  "image",
  "pdf",
  "voice",
  "file",
  "journal",
  "clipboard",
]);

export const captureStatus = pgEnum("capture_status", ["new", "organized", "archived", "deleted"]);

export const captureSource = pgEnum("capture_source", [
  "quick_add",
  "command_center",
  "share",
  "manual",
  "import",
  "drag_drop",
  "paste",
]);

/** Every captured item. Lives in the inbox (`new`) until the user organizes it. */
export const inboxItems = pgTable("inbox_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: captureType("type").notNull().default("text"),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  status: captureStatus("status").notNull().default("new"),
  source: captureSource("source").notNull().default("quick_add"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  organizedAt: timestamp("organized_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InboxItemRow = typeof inboxItems.$inferSelect;
export type InboxItemInsert = typeof inboxItems.$inferInsert;
