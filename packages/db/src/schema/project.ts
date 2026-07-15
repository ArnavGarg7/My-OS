/**
 * Project schema (Sprint 2.8). Projects own long-term outcomes above the
 * execution layer — milestones, objectives, dependencies and an append-only
 * history. Progress / health / forecast are derived at read time, never stored.
 * Single user (05_Database_Design.md §0: no user_id on domain tables).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const projectStatus = pgEnum("project_status", [
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
]);

export const projectPriority = pgEnum("project_priority", ["low", "medium", "high", "critical"]);

export const projectHealth = pgEnum("project_health", [
  "healthy",
  "at_risk",
  "behind",
  "blocked",
  "completed",
]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  status: projectStatus("status").notNull().default("planning"),
  priority: projectPriority("priority").notNull().default("medium"),
  color: text("color").notNull().default("blue"),
  owner: text("owner").notNull().default(""),
  startDate: timestamp("start_date", { withTimezone: true }),
  targetDate: timestamp("target_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const objectives = pgTable("objectives", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetValue: doublePrecision("target_value").notNull().default(0),
  currentValue: doublePrecision("current_value").notNull().default(0),
  unit: text("unit").notNull().default(""),
  completed: boolean("completed").notNull().default(false),
});

export const projectDependencies = pgTable(
  "project_dependencies",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    dependsOn: uuid("depends_on")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.projectId, t.dependsOn] }) }),
);

/** Append-only audit log of project actions. */
export const projectHistory = pgTable("project_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  milestones: many(milestones),
  objectives: many(objectives),
  history: many(projectHistory),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, { fields: [milestones.projectId], references: [projects.id] }),
}));

export const objectivesRelations = relations(objectives, ({ one }) => ({
  project: one(projects, { fields: [objectives.projectId], references: [projects.id] }),
}));

export type ProjectRow = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
export type MilestoneRow = typeof milestones.$inferSelect;
export type MilestoneInsert = typeof milestones.$inferInsert;
export type ObjectiveRow = typeof objectives.$inferSelect;
export type ObjectiveInsert = typeof objectives.$inferInsert;
export type ProjectDependencyRow = typeof projectDependencies.$inferSelect;
export type ProjectHistoryRow = typeof projectHistory.$inferSelect;
