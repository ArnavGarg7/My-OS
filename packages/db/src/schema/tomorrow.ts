/**
 * Tomorrow Studio schema (Sprint 3.1). Persists the structured planning decisions
 * of the evening workflow — the plan header, chosen priorities, evening checklist
 * and a lightweight day review. Tomorrow Studio owns none of the underlying work;
 * priorities reference existing tasks/projects/goals. Single user (05 §0).
 */
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const tomorrowStatus = pgEnum("tomorrow_status", [
  "draft",
  "planned",
  "locked",
  "completed",
]);

export const tomorrowPlans = pgTable("tomorrow_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  planningDate: date("planning_date", { mode: "string" }).notNull().unique(),
  targetDate: date("target_date", { mode: "string" }).notNull(),
  status: tomorrowStatus("status").notNull().default("draft"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tomorrowPriorities = pgTable("tomorrow_priorities", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => tomorrowPlans.id, { onDelete: "cascade" }),
  priorityOrder: integer("priority_order").notNull().default(0),
  taskId: uuid("task_id"),
  projectId: uuid("project_id"),
  goalId: uuid("goal_id"),
  title: text("title").notNull(),
});

export const tomorrowChecklist = pgTable("tomorrow_checklist", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => tomorrowPlans.id, { onDelete: "cascade" }),
  item: text("item").notNull(),
  completed: boolean("completed").notNull().default(false),
  required: boolean("required").notNull().default(false),
});

/** A lightweight evening review snapshot (one row per planning date). */
export const tomorrowReviews = pgTable("tomorrow_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  planningDate: date("planning_date", { mode: "string" }).notNull().unique(),
  completionScore: integer("completion_score").notNull().default(0),
  plannerAccuracy: integer("planner_accuracy").notNull().default(0),
  deepWork: integer("deep_work").notNull().default(0),
  unfinishedTasks: integer("unfinished_tasks").notNull().default(0),
  summary: text("summary").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TomorrowPlanRow = typeof tomorrowPlans.$inferSelect;
export type TomorrowPlanInsert = typeof tomorrowPlans.$inferInsert;
export type TomorrowPriorityRow = typeof tomorrowPriorities.$inferSelect;
export type TomorrowChecklistRow = typeof tomorrowChecklist.$inferSelect;
export type TomorrowReviewRow = typeof tomorrowReviews.$inferSelect;
