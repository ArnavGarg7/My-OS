/**
 * Goal schema (Sprint 2.12). The strategic layer — life goals → objectives →
 * key results, plus habits, period reviews and links to existing entities
 * (no duplication). Progress/forecast are DERIVED, never stored. Single user
 * (05 §0: no user_id).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const goalType = pgEnum("goal_type", [
  "life",
  "career",
  "education",
  "health",
  "finance",
  "personal",
]);

export const goalStatus = pgEnum("goal_status", [
  "planned",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const goalReviewPeriod = pgEnum("goal_review_period", [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const habitFrequency = pgEnum("habit_frequency", ["daily", "weekly", "monthly"]);

export const goalMetricType = pgEnum("goal_metric_type", [
  "numeric",
  "percentage",
  "boolean",
  "milestone",
]);

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  goalType: goalType("goal_type").notNull().default("personal"),
  status: goalStatus("status").notNull().default("planned"),
  priority: text("priority").notNull().default("medium"),
  targetDate: date("target_date", { mode: "string" }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Sprint 4.2 (Personal Growth) extensions — hierarchy + vision framing. Nullable.
  parentGoal: uuid("parent_goal"),
  visionCategory: text("vision_category"),
  reviewFrequency: text("review_frequency"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const goalObjectives = pgTable("goal_objectives", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  weight: doublePrecision("weight").notNull().default(1),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const keyResults = pgTable("key_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  objectiveId: uuid("objective_id")
    .notNull()
    .references(() => goalObjectives.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  metricType: goalMetricType("metric_type").notNull().default("numeric"),
  currentValue: doublePrecision("current_value").notNull().default(0),
  targetValue: doublePrecision("target_value").notNull().default(100),
  unit: text("unit").notNull().default(""),
  status: text("status").notNull().default("active"),
});

export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  frequency: habitFrequency("frequency").notNull().default("daily"),
  target: integer("target").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastCompleted: date("last_completed", { mode: "string" }),
  active: boolean("active").notNull().default(true),
  history: jsonb("history").$type<string[]>().notNull().default([]),
});

export const goalReviews = pgTable("goal_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  reviewPeriod: goalReviewPeriod("review_period").notNull(),
  summary: text("summary").notNull().default(""),
  progressSnapshot: doublePrecision("progress_snapshot").notNull().default(0),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Links a goal to existing entities without duplicating their data. */
export const goalLinks = pgTable("goal_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  projectId: uuid("project_id"),
  taskId: uuid("task_id"),
  journalEntryId: uuid("journal_entry_id"),
  financeGoalId: uuid("finance_goal_id"),
  healthMetric: text("health_metric"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const goalsRelations = relations(goals, ({ many }) => ({
  objectives: many(goalObjectives),
  habits: many(habits),
  reviews: many(goalReviews),
  links: many(goalLinks),
}));

export const goalObjectivesRelations = relations(goalObjectives, ({ one, many }) => ({
  goal: one(goals, { fields: [goalObjectives.goalId], references: [goals.id] }),
  keyResults: many(keyResults),
}));

export const keyResultsRelations = relations(keyResults, ({ one }) => ({
  objective: one(goalObjectives, {
    fields: [keyResults.objectiveId],
    references: [goalObjectives.id],
  }),
}));

export type GoalRow = typeof goals.$inferSelect;
export type GoalInsert = typeof goals.$inferInsert;
export type GoalObjectiveRow = typeof goalObjectives.$inferSelect;
export type KeyResultRow = typeof keyResults.$inferSelect;
export type HabitRow = typeof habits.$inferSelect;
export type GoalReviewRow = typeof goalReviews.$inferSelect;
export type GoalLinkRow = typeof goalLinks.$inferSelect;
