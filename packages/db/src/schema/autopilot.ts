/**
 * Proposal-First Automation Engine schema (Sprint 6.3, Phase 6). Persists the deterministic
 * execution layer: registered automations (registry snapshot), proposals, immutable execution +
 * verification + rollback records, per-automation policies/permissions, and the audit timeline +
 * metrics. Tables are `autopilot_`-prefixed to avoid the Sprint 3.4 `automation_*` rule engine.
 * Execution records are IMMUTABLE — a re-run appends new rows. No AI executes; nothing here mutates
 * business data on its own. Single user (05 §0).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Registry snapshot — one row per registered automation (immutable after registration). */
export const autopilotAutomations = pgTable(
  "autopilot_automations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    automationKey: text("automation_key").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    trigger: text("trigger").notNull(),
    risk: text("risk").notNull().default("low"),
    category: text("category").notNull().default(""),
    reversible: boolean("reversible").notNull().default(true),
    version: text("version").notNull().default("1"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("autopilot_automations_key_idx").on(t.automationKey) }),
);

/** Trigger definitions per automation (reference). */
export const autopilotTriggers = pgTable("autopilot_triggers", {
  id: uuid("id").defaultRandom().primaryKey(),
  automationKey: text("automation_key").notNull(),
  kind: text("kind").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Condition definitions per automation (reference). */
export const autopilotConditions = pgTable("autopilot_conditions", {
  id: uuid("id").defaultRandom().primaryKey(),
  automationKey: text("automation_key").notNull(),
  fact: text("fact").notNull(),
  op: text("op").notNull(),
  value: jsonb("value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Proposals — the reviewable units. `state` is the only mutable field (approval lifecycle). */
export const autopilotProposals = pgTable(
  "autopilot_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    automationKey: text("automation_key").notNull(),
    title: text("title").notNull(),
    reason: text("reason").notNull().default(""),
    expectedBenefit: text("expected_benefit").notNull().default(""),
    risk: text("risk").notNull().default("low"),
    rollbackSummary: text("rollback_summary").notNull().default(""),
    plan: jsonb("plan").$type<Record<string, unknown>>().notNull(),
    policy: text("policy").notNull().default("always_ask"),
    state: text("state").notNull().default("pending_approval"),
    sourceKind: text("source_kind"),
    sourceId: text("source_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byState: index("autopilot_proposals_state_idx").on(t.state) }),
);

/** Immutable execution records. */
export const autopilotExecutions = pgTable(
  "autopilot_executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id").notNull(),
    ok: boolean("ok").notNull().default(false),
    results: jsonb("results").$type<unknown[]>().notNull().default([]),
    attempts: integer("attempts").notNull().default(1),
    durationMs: real("duration_ms").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProposal: index("autopilot_executions_proposal_idx").on(t.proposalId) }),
);

/** Immutable verification records. */
export const autopilotVerifications = pgTable(
  "autopilot_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id").notNull(),
    passed: boolean("passed").notNull().default(false),
    checks: jsonb("checks").$type<unknown[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProposal: index("autopilot_verifications_proposal_idx").on(t.proposalId) }),
);

/** Immutable rollback records. */
export const autopilotRollbacks = pgTable(
  "autopilot_rollbacks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id").notNull(),
    ok: boolean("ok").notNull().default(false),
    results: jsonb("results").$type<unknown[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProposal: index("autopilot_rollbacks_proposal_idx").on(t.proposalId) }),
);

/** Per-automation user policy (always_ask/ask_once/trusted/disabled). One row per automation key. */
export const autopilotPolicies = pgTable(
  "autopilot_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    automationKey: text("automation_key").notNull(),
    policy: text("policy").notNull().default("always_ask"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byKey: index("autopilot_policies_key_idx").on(t.automationKey) }),
);

/** Permission grants an automation requires (reference). */
export const autopilotPermissions = pgTable("autopilot_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  automationKey: text("automation_key").notNull(),
  permission: text("permission").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only audit trail. */
export const autopilotAudit = pgTable(
  "autopilot_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id").notNull(),
    state: text("state").notNull(),
    detail: text("detail").notNull().default(""),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProposal: index("autopilot_audit_proposal_idx").on(t.proposalId) }),
);

/** Timeline snapshots (past → present) for the dashboard. */
export const autopilotTimelines = pgTable(
  "autopilot_timelines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id"),
    label: text("label").notNull().default(""),
    detail: text("detail").notNull().default(""),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProposal: index("autopilot_timelines_proposal_idx").on(t.proposalId) }),
);

/** Per-run analytics snapshot. */
export const autopilotMetrics = pgTable("autopilot_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposals: integer("proposals").notNull().default(0),
  approved: integer("approved").notNull().default(0),
  executed: integer("executed").notNull().default(0),
  rolledBack: integer("rolled_back").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  trustedUsage: integer("trusted_usage").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
