/**
 * Task schema (Sprint 2.5). The canonical work model of My OS — consumed later
 * by Planner, Projects, AI and Calendar. Single user (05_Database_Design.md §0:
 * no user_id on domain tables). Five tables: tasks, dependencies, labels, the
 * label map, and recurring rules.
 */
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const taskStatus = pgEnum("task_status", [
  "not_started",
  "in_progress",
  "blocked",
  "completed",
  "archived",
]);

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

export const recurrenceFrequency = pgEnum("recurrence_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: taskStatus("status").notNull().default("not_started"),
  priority: taskPriority("priority").notNull().default("medium"),
  estimatedMinutes: integer("estimated_minutes"),
  actualMinutes: integer("actual_minutes"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  parentTaskId: uuid("parent_task_id"),
  /** Project hierarchy ownership (Sprint 2.8) — all optional. */
  projectId: uuid("project_id"),
  milestoneId: uuid("milestone_id"),
  objectiveId: uuid("objective_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.taskId, t.dependsOnTaskId] }) }),
);

export const taskLabels = pgTable("task_labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("gray"),
});

export const taskLabelMap = pgTable(
  "task_label_map",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => taskLabels.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.taskId, t.labelId] }) }),
);

export const recurringTasks = pgTable("recurring_tasks", {
  taskId: uuid("task_id")
    .primaryKey()
    .references(() => tasks.id, { onDelete: "cascade" }),
  frequency: recurrenceFrequency("frequency").notNull(),
  interval: integer("interval").notNull().default(1),
  nextOccurrence: timestamp("next_occurrence", { withTimezone: true }),
});

export const tasksRelations = relations(tasks, ({ many, one }) => ({
  dependencies: many(taskDependencies, { relationName: "task" }),
  labels: many(taskLabelMap),
  recurrence: one(recurringTasks, {
    fields: [tasks.id],
    references: [recurringTasks.taskId],
  }),
}));

export type TaskRow = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
export type TaskDependencyRow = typeof taskDependencies.$inferSelect;
export type TaskLabelRow = typeof taskLabels.$inferSelect;
export type TaskLabelMapRow = typeof taskLabelMap.$inferSelect;
export type RecurringTaskRow = typeof recurringTasks.$inferSelect;
