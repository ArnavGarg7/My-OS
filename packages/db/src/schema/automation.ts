/**
 * Automation engine schema (Sprint 3.4). The Automation Engine is a PLATFORM engine —
 * it stores rules (trigger + policy), their conditions + actions, an append-only
 * execution history and a derived per-rule statistics cache. It holds no feature data;
 * every rule references existing module signals (triggers) and services (actions).
 * Single user (05 §0).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const automationStatus = pgEnum("automation_status", [
  "created",
  "enabled",
  "disabled",
  "archived",
]);

export const triggerKind = pgEnum("trigger_kind", [
  "planner",
  "task",
  "focus",
  "calendar",
  "notification",
  "health",
  "journal",
  "finance",
  "goals",
  "projects",
  "timeline",
  "analytics",
  "tomorrow",
  "morning",
  "inbox",
  "manual",
  "time",
]);

export const actionKind = pgEnum("action_kind", [
  "generate_notification",
  "start_focus",
  "pause_focus",
  "resume_focus",
  "complete_focus",
  "generate_planner",
  "regenerate_planner",
  "open_tomorrow",
  "mark_decision_complete",
  "generate_decision",
  "dismiss_decision",
  "open_journal",
  "log_timeline_event",
  "emit_analytics_event",
  "create_reminder",
  "complete_reminder",
  "run_custom_workflow",
  "noop",
]);

export const executionPolicy = pgEnum("execution_policy", [
  "run_once",
  "run_always",
  "cooldown",
  "throttle",
  "max_executions",
  "retry",
  "delay",
  "schedule",
  "manual_approval",
]);

export const automationRules = pgTable(
  "automation_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: automationStatus("status").notNull().default("created"),
    priority: text("priority").notNull().default("medium"),
    triggerKind: triggerKind("trigger_kind").notNull(),
    triggerEvent: text("trigger_event").notNull().default(""),
    /** Execution policy config as JSON (policy + its parameters). */
    policy: jsonb("policy").notNull().default({ policy: "run_always" }),
    builtIn: boolean("built_in").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byStatus: index("automation_rules_status_idx").on(t.status),
    byTrigger: index("automation_rules_trigger_idx").on(t.triggerKind),
  }),
);

/** The condition tree for a rule (one row per rule, stored as a JSON group). */
export const automationConditions = pgTable("automation_conditions", {
  id: uuid("id").defaultRandom().primaryKey(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => automationRules.id, { onDelete: "cascade" }),
  /** The full ConditionGroup as JSON. */
  tree: jsonb("tree").notNull().default({ combinator: "and", conditions: [] }),
});

export const automationActions = pgTable(
  "automation_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => automationRules.id, { onDelete: "cascade" }),
    kind: actionKind("kind").notNull(),
    params: jsonb("params").notNull().default({}),
    actionOrder: integer("action_order").notNull().default(0),
  },
  (t) => ({ byRule: index("automation_actions_rule_idx").on(t.ruleId) }),
);

export const automationHistory = pgTable(
  "automation_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => automationRules.id, { onDelete: "cascade" }),
    outcome: text("outcome").notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    runtimeMs: integer("runtime_ms"),
    actionResults: jsonb("action_results").notNull().default([]),
    error: text("error"),
  },
  (t) => ({
    byRule: index("automation_history_rule_idx").on(t.ruleId),
    byTriggeredAt: index("automation_history_at_idx").on(t.triggeredAt),
  }),
);

/** Derived per-rule statistics cache (always reproducible from history). */
export const automationStatistics = pgTable("automation_statistics", {
  id: uuid("id").defaultRandom().primaryKey(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => automationRules.id, { onDelete: "cascade" })
    .unique(),
  executions: integer("executions").notNull().default(0),
  successes: integer("successes").notNull().default(0),
  failures: integer("failures").notNull().default(0),
  skipped: integer("skipped").notNull().default(0),
  averageRuntimeMs: integer("average_runtime_ms").notNull().default(0),
  failureRate: integer("failure_rate").notNull().default(0),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastOutcome: text("last_outcome"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AutomationRuleRow = typeof automationRules.$inferSelect;
export type AutomationRuleInsert = typeof automationRules.$inferInsert;
export type AutomationConditionRow = typeof automationConditions.$inferSelect;
export type AutomationActionRow = typeof automationActions.$inferSelect;
export type AutomationHistoryRow = typeof automationHistory.$inferSelect;
export type AutomationStatisticsRow = typeof automationStatistics.$inferSelect;
