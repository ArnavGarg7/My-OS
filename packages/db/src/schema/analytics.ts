/**
 * Analytics schema (Sprint 2.14). The final deterministic layer. Analytics never
 * owns business data — these tables only cache derived reports/snapshots + store
 * generated period reviews. Everything is reproducible from the source engines.
 * Single user (05 §0: no user_id).
 */
import { date, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const reportType = pgEnum("report_type", [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const comparisonPeriod = pgEnum("comparison_period", [
  "previous_day",
  "previous_week",
  "previous_month",
  "previous_quarter",
  "previous_year",
]);

export const analyticsReports = pgTable("analytics_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportType: reportType("report_type").notNull(),
  periodStart: date("period_start", { mode: "string" }).notNull(),
  periodEnd: date("period_end", { mode: "string" }).notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
});

/** Cached deterministic daily metric snapshot (one row per day). */
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  snapshotDate: date("snapshot_date", { mode: "string" }).notNull().unique(),
  productivityScore: integer("productivity_score").notNull().default(0),
  focusScore: integer("focus_score").notNull().default(0),
  plannerAccuracy: integer("planner_accuracy").notNull().default(0),
  healthScore: integer("health_score").notNull().default(0),
  goalProgress: integer("goal_progress").notNull().default(0),
  financeScore: integer("finance_score").notNull().default(0),
  journalScore: integer("journal_score").notNull().default(0),
  overallScore: integer("overall_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weeklyReviews = pgTable("weekly_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekStart: date("week_start", { mode: "string" }).notNull(),
  weekEnd: date("week_end", { mode: "string" }).notNull(),
  summary: text("summary").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const monthlyReviews = pgTable("monthly_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  month: integer("month").notNull(), // 1–12
  year: integer("year").notNull(),
  summary: text("summary").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnalyticsReportRow = typeof analyticsReports.$inferSelect;
export type AnalyticsSnapshotRow = typeof analyticsSnapshots.$inferSelect;
export type WeeklyReviewRow = typeof weeklyReviews.$inferSelect;
export type MonthlyReviewRow = typeof monthlyReviews.$inferSelect;
