/**
 * Journal schema (Sprint 2.10). The canonical home for personal writing +
 * structured reflection. Entries, daily reflections, period reviews and links
 * to existing entities (no data duplication). Derived analytics (mood trend,
 * streaks, writing stats) are NOT stored. Single user (05 §0: no user_id).
 */
import { relations } from "drizzle-orm";
import { boolean, date, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const entryType = pgEnum("entry_type", [
  "daily",
  "reflection",
  "gratitude",
  "review",
  "idea",
]);

export const moodLevel = pgEnum("mood_level", ["very_low", "low", "neutral", "good", "excellent"]);

export const reviewPeriod = pgEnum("review_period", ["daily", "weekly", "monthly", "yearly"]);

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  entryType: entryType("entry_type").notNull().default("daily"),
  mood: moodLevel("mood"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyReflections = pgTable("daily_reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  reflection: text("reflection").notNull().default(""),
  wins: jsonb("wins").$type<string[]>().notNull().default([]),
  lessons: jsonb("lessons").$type<string[]>().notNull().default([]),
  gratitude: jsonb("gratitude").$type<string[]>().notNull().default([]),
  tomorrowFocus: text("tomorrow_focus").notNull().default(""),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journalReviews = pgTable("journal_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  period: reviewPeriod("period").notNull(),
  summary: text("summary").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Links a journal entry to existing entities without duplicating their data. */
export const journalLinks = pgTable("journal_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  taskId: uuid("task_id"),
  projectId: uuid("project_id"),
  milestoneId: uuid("milestone_id"),
  decisionId: uuid("decision_id"),
  plannerBlockId: uuid("planner_block_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  links: many(journalLinks),
}));

export const journalLinksRelations = relations(journalLinks, ({ one }) => ({
  entry: one(journalEntries, { fields: [journalLinks.entryId], references: [journalEntries.id] }),
}));

export type JournalEntryRow = typeof journalEntries.$inferSelect;
export type JournalEntryInsert = typeof journalEntries.$inferInsert;
export type DailyReflectionRow = typeof dailyReflections.$inferSelect;
export type JournalReviewRow = typeof journalReviews.$inferSelect;
export type JournalLinkRow = typeof journalLinks.$inferSelect;
