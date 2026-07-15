/**
 * Today schema (Sprint 2.1) — the first real feature module's storage. Single
 * user (05_Database_Design.md §0: no user_id on domain tables). `daily_state` is
 * the per-day anchor; focus/metrics/notes/decisions hang off the date.
 * Intentionally minimal — these grow in later sprints.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const energyLevel = pgEnum("energy_level", ["low", "medium", "high"]);
export const dayStatus = pgEnum("day_status", [
  "idle",
  "planning",
  "active",
  "break",
  "wrapping_up",
  "done",
]);
export const noteType = pgEnum("note_type", ["note", "thought", "focus", "reflection", "idea"]);

export const decisionStatus = pgEnum("decision_status", [
  "pending",
  "accepted",
  "dismissed",
  "deferred",
  "expired",
  "completed",
]);
export const decisionPriority = pgEnum("decision_priority", ["critical", "high", "medium", "low"]);

type EnergyEntryJson = { at: string; level: "low" | "medium" | "high" };

/** Per-day state — the anchor row for a given date. */
export const dailyState = pgTable("daily_state", {
  date: date("date", { mode: "string" }).primaryKey(),
  wakeTime: text("wake_time"),
  sleepTarget: text("sleep_target"),
  energyLevel: energyLevel("energy_level"),
  focusScore: integer("focus_score"),
  currentBlock: text("current_block"),
  currentActivity: text("current_activity"),
  status: dayStatus("status").notNull().default("idle"),
  morningCompleted: boolean("morning_completed").notNull().default(false),
  morningCompletedAt: timestamp("morning_completed_at", { withTimezone: true }),
  eveningCompleted: boolean("evening_completed").notNull().default(false),
  lastRecalculatedAt: timestamp("last_recalculated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Editable focus fields for the day (nothing AI-generated). */
export const dailyFocus = pgTable("daily_focus", {
  date: date("date", { mode: "string" })
    .primaryKey()
    .references(() => dailyState.date, { onDelete: "cascade" }),
  mission: text("mission"),
  blocker: text("blocker"),
  priority: text("priority"),
  deepWork: text("deep_work"),
  quickWin: text("quick_win"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Raw metrics for the day (storage only — no analytics here). */
export const dailyMetrics = pgTable("daily_metrics", {
  date: date("date", { mode: "string" })
    .primaryKey()
    .references(() => dailyState.date, { onDelete: "cascade" }),
  completedTasks: integer("completed_tasks").notNull().default(0),
  deepWorkMinutes: integer("deep_work_minutes").notNull().default(0),
  meetings: integer("meetings").notNull().default(0),
  interruptions: integer("interruptions").notNull().default(0),
  focusSwitches: integer("focus_switches").notNull().default(0),
  plannerAccuracy: integer("planner_accuracy"),
  energyEntries: jsonb("energy_entries").$type<EnergyEntryJson[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Tiny timestamped notes attached to a day. */
export const dailyNotes = pgTable("daily_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date", { mode: "string" })
    .notNull()
    .references(() => dailyState.date, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  content: text("content").notNull(),
  type: noteType("type").notNull().default("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Every recommendation/decision the OS makes is logged here. Extended in Sprint
 * 2.3 with the decision lifecycle (status/priority/score/expiry/defer/rule/meta).
 * The `accepted`/`dismissed` booleans are kept for back-compat; `status` is the
 * source of truth.
 */
export const decisionHistory = pgTable("decision_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date", { mode: "string" })
    .notNull()
    .references(() => dailyState.date, { onDelete: "cascade" }),
  decision: text("decision").notNull(),
  reason: text("reason"),
  confidence: integer("confidence"),
  accepted: boolean("accepted").notNull().default(false),
  dismissed: boolean("dismissed").notNull().default(false),
  // Sprint 2.3 decision lifecycle
  status: decisionStatus("status").notNull().default("pending"),
  priority: decisionPriority("priority").notNull().default("medium"),
  score: integer("score").notNull().default(0),
  ruleId: text("rule_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deferredUntil: timestamp("deferred_until", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyStateRelations = relations(dailyState, ({ one, many }) => ({
  focus: one(dailyFocus, { fields: [dailyState.date], references: [dailyFocus.date] }),
  metrics: one(dailyMetrics, { fields: [dailyState.date], references: [dailyMetrics.date] }),
  notes: many(dailyNotes),
  decisions: many(decisionHistory),
}));

export type DailyStateRow = typeof dailyState.$inferSelect;
export type DailyFocusRow = typeof dailyFocus.$inferSelect;
export type DailyMetricsRow = typeof dailyMetrics.$inferSelect;
export type DailyNoteRow = typeof dailyNotes.$inferSelect;
export type DecisionHistoryRow = typeof decisionHistory.$inferSelect;
