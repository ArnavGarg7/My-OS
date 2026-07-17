/**
 * Personal Intelligence Dashboard schema (Sprint 4.4, Phase 4 finale). The executive layer.
 *
 * Critically, NO analytics are persisted here. Every score, trend, scorecard and attention
 * item is recomputed on read from the modules that own the data. These seven tables store
 * only two things: user CONFIGURATION (dashboard layout, collections) and immutable
 * SNAPSHOTS (a review as it stood on its date, a report as generated, an achievement as
 * unlocked). A snapshot is history, never a cache — it is never recomputed. Single user
 * (05 §0: no user_id).
 */
import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Dashboard layout. Ordering + visibility ONLY — isolated from all business data. */
export const dashboardPreferences = pgTable("dashboard_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  widgetOrder: jsonb("widget_order").$type<string[]>().notNull().default([]),
  hiddenWidgets: jsonb("hidden_widgets").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A user collection that GROUPS existing entities by reference — never copies their data. */
export const savedCollections = pgTable("saved_collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  /** References into other modules: [{ module, id }] — ids only. */
  entityRefs: jsonb("entity_refs").$type<{ module: string; id: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A generated report, stored as the text it was rendered to. Not recomputed. */
export const executiveReports = pgTable(
  "executive_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    period: text("period").notNull(),
    format: text("format").notNull().default("markdown"),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byGenerated: index("executive_reports_generated_idx").on(t.generatedAt) }),
);

/** An IMMUTABLE review snapshot — what the numbers were on the review date. */
export const reviewSnapshots = pgTable(
  "review_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    period: text("period").notNull(),
    periodStart: text("period_start").notNull(),
    /** The full snapshot payload (overall/areas/attention/highlights) as generated. */
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byPeriod: index("review_snapshots_period_idx").on(t.period, t.periodStart) }),
);

/** When an achievement was unlocked. A historical record; the rule engine derives current state. */
export const achievementHistory = pgTable(
  "achievement_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    achievementId: text("achievement_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byAchievement: index("achievement_history_achievement_idx").on(t.achievementId) }),
);

/** Acknowledged/dismissed attention items — user state over the DERIVED attention list. */
export const attentionItems = pgTable(
  "attention_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** The derived attention item's stable id (e.g. "goal-slipping"). */
    itemKey: text("item_key").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("attention_items_key_idx").on(t.itemKey) }),
);

/** Recorded milestone completions rolled up from owning modules — history only. */
export const milestoneHistory = pgTable(
  "milestone_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    milestoneId: text("milestone_id").notNull(),
    source: text("source").notNull().default(""),
    title: text("title").notNull().default(""),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byMilestone: index("milestone_history_milestone_idx").on(t.milestoneId) }),
);

/* ── Relations (none cross-reference business data; config is standalone) ── */
export const savedCollectionsRelations = relations(savedCollections, () => ({}));

/* ── Row types ──────────────────────────────────────────────────────────── */
export type DashboardPreferencesRow = typeof dashboardPreferences.$inferSelect;
export type SavedCollectionRow = typeof savedCollections.$inferSelect;
export type ExecutiveReportRow = typeof executiveReports.$inferSelect;
export type ReviewSnapshotRow = typeof reviewSnapshots.$inferSelect;
export type AchievementHistoryRow = typeof achievementHistory.$inferSelect;
export type AttentionItemRow = typeof attentionItems.$inferSelect;
export type MilestoneHistoryRow = typeof milestoneHistory.$inferSelect;
