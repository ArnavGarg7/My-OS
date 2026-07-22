import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  autopilotAudit,
  autopilotExecutions,
  autopilotMetrics,
  autopilotPolicies,
  autopilotProposals,
  autopilotRollbacks,
  autopilotVerifications,
} from "@myos/db/schema";
import type {
  AutomationAnalytics,
  Policy,
  Proposal,
  StepResult,
  VerificationResult,
} from "@myos/core/autopilot";

/**
 * Autopilot repository (Sprint 6.3). Persists proposals + immutable execution/verification/rollback
 * records + the audit trail + per-automation policies + metrics. Only a proposal's `state` is ever
 * updated (the approval lifecycle); execution records are append-only.
 */

function rowToProposal(r: typeof autopilotProposals.$inferSelect): Proposal {
  return {
    id: r.id,
    automationId: r.automationKey,
    title: r.title,
    reason: r.reason,
    expectedBenefit: r.expectedBenefit,
    risk: r.risk as Proposal["risk"],
    rollbackSummary: r.rollbackSummary,
    plan: r.plan as unknown as Proposal["plan"],
    policy: r.policy as Policy,
    state: r.state as Proposal["state"],
    source: r.sourceKind
      ? { kind: r.sourceKind as "signal" | "prediction" | "manual", id: r.sourceId ?? "" }
      : null,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Insert a fresh proposal (idempotent by automationKey + sourceId + pending). */
export async function insertProposal(db: Database, p: Proposal): Promise<string> {
  const [row] = await db
    .insert(autopilotProposals)
    .values({
      automationKey: p.automationId,
      title: p.title,
      reason: p.reason,
      expectedBenefit: p.expectedBenefit,
      risk: p.risk,
      rollbackSummary: p.rollbackSummary,
      plan: p.plan as unknown as Record<string, unknown>,
      policy: p.policy,
      state: p.state,
      sourceKind: p.source?.kind ?? null,
      sourceId: p.source?.id ?? null,
    })
    .returning({ id: autopilotProposals.id });
  await audit(db, row!.id, "proposal_created", p.reason);
  return row!.id;
}

/** Whether a pending/active proposal already exists for this automation + source. */
export async function proposalExists(
  db: Database,
  automationKey: string,
  sourceId: string | null,
): Promise<boolean> {
  const rows = await db
    .select({
      id: autopilotProposals.id,
      state: autopilotProposals.state,
      src: autopilotProposals.sourceId,
    })
    .from(autopilotProposals)
    .where(eq(autopilotProposals.automationKey, automationKey));
  return rows.some(
    (r) =>
      r.src === sourceId &&
      (r.state === "pending_approval" || r.state === "approved" || r.state === "executing"),
  );
}

export async function loadProposal(db: Database, id: string): Promise<Proposal | null> {
  const [row] = await db
    .select()
    .from(autopilotProposals)
    .where(eq(autopilotProposals.id, id))
    .limit(1);
  return row ? rowToProposal(row) : null;
}

export async function listProposals(db: Database, limit = 50): Promise<Proposal[]> {
  const rows = await db
    .select()
    .from(autopilotProposals)
    .orderBy(desc(autopilotProposals.createdAt))
    .limit(limit);
  return rows.map(rowToProposal);
}

/** Update a proposal's lifecycle state (the only mutation) + audit it. */
export async function setState(
  db: Database,
  id: string,
  state: Proposal["state"],
  detail = "",
): Promise<void> {
  await db.update(autopilotProposals).set({ state }).where(eq(autopilotProposals.id, id));
  await audit(db, id, state, detail);
}

export async function recordExecution(
  db: Database,
  proposalId: string,
  ok: boolean,
  results: StepResult[],
  attempts: number,
  durationMs: number,
): Promise<void> {
  await db.insert(autopilotExecutions).values({ proposalId, ok, results, attempts, durationMs });
}

export async function recordVerification(
  db: Database,
  proposalId: string,
  v: VerificationResult,
): Promise<void> {
  await db
    .insert(autopilotVerifications)
    .values({ proposalId, passed: v.passed, checks: v.checks });
  await audit(db, proposalId, v.passed ? "verification_passed" : "verification_failed", "");
}

export async function recordRollback(
  db: Database,
  proposalId: string,
  ok: boolean,
  results: StepResult[],
): Promise<void> {
  await db.insert(autopilotRollbacks).values({ proposalId, ok, results });
}

export async function audit(
  db: Database,
  proposalId: string,
  state: string,
  detail: string,
): Promise<void> {
  await db.insert(autopilotAudit).values({ proposalId, state, detail });
}

export async function loadAudit(db: Database, proposalId: string) {
  return db
    .select()
    .from(autopilotAudit)
    .where(eq(autopilotAudit.proposalId, proposalId))
    .orderBy(autopilotAudit.at);
}

/** Per-automation policy (user override). */
export async function loadPolicy(db: Database, automationKey: string): Promise<Policy | null> {
  const [row] = await db
    .select()
    .from(autopilotPolicies)
    .where(eq(autopilotPolicies.automationKey, automationKey))
    .limit(1);
  return row ? (row.policy as Policy) : null;
}

export async function loadAllPolicies(db: Database): Promise<Record<string, Policy>> {
  const rows = await db.select().from(autopilotPolicies);
  return Object.fromEntries(rows.map((r) => [r.automationKey, r.policy as Policy]));
}

export async function savePolicy(
  db: Database,
  automationKey: string,
  policy: Policy,
): Promise<void> {
  const [existing] = await db
    .select({ id: autopilotPolicies.id })
    .from(autopilotPolicies)
    .where(eq(autopilotPolicies.automationKey, automationKey))
    .limit(1);
  if (existing)
    await db
      .update(autopilotPolicies)
      .set({ policy, updatedAt: new Date() })
      .where(eq(autopilotPolicies.id, existing.id));
  else await db.insert(autopilotPolicies).values({ automationKey, policy });
}

/** Persist an analytics snapshot. */
export async function recordMetrics(db: Database, a: AutomationAnalytics): Promise<void> {
  await db.insert(autopilotMetrics).values({
    proposals: a.proposals,
    approved: a.approved,
    executed: a.executed,
    rolledBack: a.rolledBack,
    failed: a.failed,
    trustedUsage: a.trustedUsage,
  });
}
