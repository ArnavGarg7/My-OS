/**
 * Focus Mode schema (Sprint 3.2). Persists focus-session EXECUTION state — the work
 * actually happening. Sessions reference existing entities (tasks, planner blocks,
 * projects) but Focus owns none of them. Timer values (elapsed/remaining/focus) are
 * NEVER stored; they derive from timestamps at read time. Metrics are derived too —
 * the daily-summary row is a cache for history, always reproducible from sessions.
 * Single user (05 §0).
 */
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const focusSessionType = pgEnum("focus_session_type", [
  "focus",
  "deep_work",
  "shallow_work",
  "review",
  "break",
  "recovery",
  "planning",
  "meeting",
]);

export const focusStatus = pgEnum("focus_status", [
  "idle",
  "running",
  "paused",
  "break",
  "completed",
  "cancelled",
  "abandoned",
]);

export const breakType = pgEnum("break_type", ["short", "long", "recovery", "hydration", "walk"]);

export const focusInterruptionType = pgEnum("focus_interruption_type", [
  "phone",
  "meeting",
  "message",
  "distraction",
  "other",
]);

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // References to existing entities — Focus never owns these.
    taskId: uuid("task_id"),
    plannerBlockId: uuid("planner_block_id"),
    projectId: uuid("project_id"),
    type: focusSessionType("type").notNull().default("focus"),
    status: focusStatus("status").notNull().default("idle"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    /** Accumulated paused/break time in milliseconds (excludes any live pause). */
    pausedDurationMs: integer("paused_duration_ms").notNull().default(0),
    /** When the current pause/break began; null unless paused/on-break. */
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    plannedMinutes: integer("planned_minutes").notNull().default(50),
    notes: text("notes").notNull().default(""),
    completed: boolean("completed").notNull().default(false),
    energyBefore: integer("energy_before"),
    energyAfter: integer("energy_after"),
    /** Local day the session belongs to (for history/summary grouping). */
    sessionDate: date("session_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byDate: index("focus_sessions_date_idx").on(t.sessionDate),
    byStatus: index("focus_sessions_status_idx").on(t.status),
  }),
);

export const focusInterruptions = pgTable(
  "focus_interruptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => focusSessions.id, { onDelete: "cascade" }),
    type: focusInterruptionType("type").notNull(),
    note: text("note"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySession: index("focus_interruptions_session_idx").on(t.sessionId) }),
);

export const focusBreaks = pgTable(
  "focus_breaks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => focusSessions.id, { onDelete: "cascade" }),
    type: breakType("type").notNull().default("short"),
    plannedMinutes: integer("planned_minutes").notNull().default(10),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => ({ bySession: index("focus_breaks_session_idx").on(t.sessionId) }),
);

/** Derived daily metrics cache (one row per day). Always reproducible from sessions. */
export const focusDailySummary = pgTable("focus_daily_summary", {
  id: uuid("id").defaultRandom().primaryKey(),
  summaryDate: date("summary_date", { mode: "string" }).notNull().unique(),
  focusMinutes: integer("focus_minutes").notNull().default(0),
  deepWorkMinutes: integer("deep_work_minutes").notNull().default(0),
  shallowMinutes: integer("shallow_minutes").notNull().default(0),
  breakMinutes: integer("break_minutes").notNull().default(0),
  interruptions: integer("interruptions").notNull().default(0),
  sessions: integer("sessions").notNull().default(0),
  completedSessions: integer("completed_sessions").notNull().default(0),
  longestSessionMinutes: integer("longest_session_minutes").notNull().default(0),
  completionRate: integer("completion_rate").notNull().default(0),
  plannerAccuracy: integer("planner_accuracy").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FocusSessionRow = typeof focusSessions.$inferSelect;
export type FocusSessionInsert = typeof focusSessions.$inferInsert;
export type FocusInterruptionRow = typeof focusInterruptions.$inferSelect;
export type FocusInterruptionInsert = typeof focusInterruptions.$inferInsert;
export type FocusBreakRow = typeof focusBreaks.$inferSelect;
export type FocusBreakInsert = typeof focusBreaks.$inferInsert;
export type FocusDailySummaryRow = typeof focusDailySummary.$inferSelect;
export type FocusDailySummaryInsert = typeof focusDailySummary.$inferInsert;
