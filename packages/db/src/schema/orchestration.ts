/**
 * Orchestration engine schema (Sprint 3.5). The final Phase-3 platform layer records
 * cross-module runs: which pipeline fired, the ordered module steps, any failures and
 * the recovery decisions applied. It stores no feature data — every step references an
 * existing engine. Single user (05 §0).
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

export const orchestrationStatus = pgEnum("orchestration_status", [
  "pending",
  "running",
  "completed",
  "recovering",
  "recovered",
  "failed",
  "skipped",
]);

export const orchestrationStep = pgEnum("orchestration_step", [
  "calendar",
  "planner",
  "focus",
  "task",
  "decision",
  "health",
  "finance",
  "goal",
  "project",
  "inbox",
  "notification",
  "morning",
  "tomorrow",
  "timeline",
  "analytics",
]);

export const recoveryStrategy = pgEnum("recovery_strategy", [
  "retry_step",
  "skip_downstream",
  "use_previous",
  "skip_step",
  "notify_user",
  "abort",
]);

export const orchestrationRuns = pgTable(
  "orchestration_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pipeline: text("pipeline").notNull(),
    trigger: text("trigger").notNull(),
    source: text("source").notNull().default("manual"),
    status: orchestrationStatus("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    runtimeMs: integer("runtime_ms"),
    affected: jsonb("affected").notNull().default([]),
    skipped: jsonb("skipped").notNull().default([]),
    failures: integer("failures").notNull().default(0),
    recoveries: integer("recoveries").notNull().default(0),
    summary: text("summary").notNull().default(""),
  },
  (t) => ({
    byStatus: index("orchestration_runs_status_idx").on(t.status),
    byStartedAt: index("orchestration_runs_started_idx").on(t.startedAt),
  }),
);

export const orchestrationSteps = pgTable(
  "orchestration_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => orchestrationRuns.id, { onDelete: "cascade" }),
    module: orchestrationStep("module").notNull(),
    stepOrder: integer("step_order").notNull().default(0),
    outcome: text("outcome").notNull(),
    mode: text("mode").notNull(),
    runtimeMs: integer("runtime_ms"),
    detail: text("detail"),
  },
  (t) => ({ byRun: index("orchestration_steps_run_idx").on(t.runId) }),
);

export const orchestrationFailures = pgTable(
  "orchestration_failures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => orchestrationRuns.id, { onDelete: "cascade" }),
    module: orchestrationStep("module").notNull(),
    error: text("error").notNull(),
    strategy: recoveryStrategy("strategy").notNull(),
    recovered: boolean("recovered").notNull().default(false),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byRun: index("orchestration_failures_run_idx").on(t.runId) }),
);

export const orchestrationRecovery = pgTable(
  "orchestration_recovery",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => orchestrationRuns.id, { onDelete: "cascade" }),
    module: orchestrationStep("module").notNull(),
    strategy: recoveryStrategy("strategy").notNull(),
    skipped: jsonb("skipped").notNull().default([]),
    reason: text("reason").notNull().default(""),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byRun: index("orchestration_recovery_run_idx").on(t.runId) }),
);

export type OrchestrationRunRow = typeof orchestrationRuns.$inferSelect;
export type OrchestrationRunInsert = typeof orchestrationRuns.$inferInsert;
export type OrchestrationStepRow = typeof orchestrationSteps.$inferSelect;
export type OrchestrationFailureRow = typeof orchestrationFailures.$inferSelect;
export type OrchestrationRecoveryRow = typeof orchestrationRecovery.$inferSelect;
