/**
 * Planner schema (Sprint 2.6). Scheduling is persisted separately from task data
 * — the Planner produces timelines it can regenerate without mutating work.
 * Single user (05_Database_Design.md §0: no user_id on domain tables).
 */
import { relations } from "drizzle-orm";
import { boolean, date, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const plannerBlockType = pgEnum("planner_block_type", [
  "focus",
  "meeting",
  "task",
  "break",
  "buffer",
  "overflow",
]);

export const plannerStatus = pgEnum("planner_status", ["empty", "generated", "optimized"]);

/** Per-day plan header. */
export const plannerDays = pgTable("planner_days", {
  date: date("date", { mode: "string" }).primaryKey(),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  workingStart: text("working_start").notNull().default("09:00"),
  workingEnd: text("working_end").notNull().default("18:00"),
  focusWindowStart: text("focus_window_start"),
  focusWindowEnd: text("focus_window_end"),
  status: plannerStatus("status").notNull().default("empty"),
  locked: boolean("locked").notNull().default(false),
});

/** A single timeline block. `task_id` is nullable (breaks / buffers / meetings). */
export const plannerBlocks = pgTable("planner_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  plannerDate: date("planner_date", { mode: "string" })
    .notNull()
    .references(() => plannerDays.date, { onDelete: "cascade" }),
  taskId: uuid("task_id"),
  type: plannerBlockType("type").notNull().default("task"),
  title: text("title").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  locked: boolean("locked").notNull().default(false),
  generated: boolean("generated").notNull().default(true),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only log of planner actions. */
export const plannerHistory = pgTable("planner_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  plannerDate: date("planner_date", { mode: "string" })
    .notNull()
    .references(() => plannerDays.date, { onDelete: "cascade" }),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plannerDaysRelations = relations(plannerDays, ({ many }) => ({
  blocks: many(plannerBlocks),
  history: many(plannerHistory),
}));

export type PlannerDayRow = typeof plannerDays.$inferSelect;
export type PlannerBlockRow = typeof plannerBlocks.$inferSelect;
export type PlannerHistoryRow = typeof plannerHistory.$inferSelect;
