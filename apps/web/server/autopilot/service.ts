import "server-only";
import type { Database } from "@myos/db";
import {
  AUTOMATIONS,
  getAutomation,
  planFromSignals,
  transition,
  isExecutable,
  executePlan,
  verifyPlan,
  rollbackPlan,
  resolvePolicy,
  trustableAutomations,
  computeAnalytics,
  chiefProposals,
  pendingProposals,
  activeProposals,
  completedProposals,
  trustedProposals,
  proposalCounts,
  buildAuditTrail,
  type ExecutionRecord,
  type Policy,
  type Proposal,
} from "@myos/core/autopilot";
import type { ExecutionPlan } from "@myos/core/autopilot";
import * as signalsService from "../signals/service";
import * as predictionService from "../prediction/service";
import { makeReader, makeRunner } from "./handlers";
import {
  insertProposal,
  listProposals,
  loadAllPolicies,
  loadAudit,
  loadPolicy,
  loadProposal,
  proposalExists,
  recordExecution,
  recordMetrics,
  recordRollback,
  recordVerification,
  savePolicy,
  setState,
} from "./repository";

/**
 * Autopilot service (Sprint 6.3). Orchestrates the proposal-first pipeline: plan proposals from live
 * Signals → approval state machine → execute via safe handlers → verify post-conditions → rollback on
 * failure → audit + analytics. Owns ALL mutations behind approval; the Chief never writes. No AI
 * executes. A `trusted` low-risk proposal runs immediately (still verified + audited); everything else
 * waits for the user.
 */

let seq = 0;
const newId = () => `ap_${Date.now().toString(36)}_${(seq += 1).toString(36)}`;

/** autopilot.plan — generate proposals from current signals + persist the new ones. */
export async function plan(db: Database, tz: string, now = new Date()): Promise<Proposal[]> {
  const { signals } = await signalsService
    .current(db, tz)
    .catch(() => ({ signals: [] as never[] }));
  const policies = await loadAllPolicies(db).catch(() => ({}) as Record<string, Policy>);
  const proposals = planFromSignals(signals, {
    newId,
    now,
    policyFor: (id) => policies[id] ?? getAutomation(id)?.defaultPolicy ?? "always_ask",
  });
  const persisted: Proposal[] = [];
  for (const p of proposals) {
    if (await proposalExists(db, p.automationId, p.source?.id ?? null).catch(() => false)) continue;
    const id = await insertProposal(db, p).catch(() => "");
    if (id) persisted.push({ ...p, id });
  }
  return persisted;
}

/** autopilot.proposals — pending proposals (planning a fresh batch first). */
export async function proposals(db: Database, tz: string) {
  await plan(db, tz).catch(() => []);
  const all = await listProposals(db).catch(() => []);
  return { proposals: pendingProposals(all), counts: proposalCounts(all) };
}

/** autopilot.list — all proposals bucketed by state. */
export async function list(db: Database) {
  const all = await listProposals(db).catch(() => []);
  return {
    pending: pendingProposals(all),
    active: activeProposals(all),
    completed: completedProposals(all),
    trusted: trustedProposals(all),
    counts: proposalCounts(all),
  };
}

/** autopilot.approve — move a pending proposal to approved (guarded transition). */
export async function approve(db: Database, proposalId: string) {
  const p = await loadProposal(db, proposalId);
  if (!p) return { ok: false, reason: "not found" };
  const next = transition(p.state, "approved");
  await setState(db, proposalId, next, "user approved");
  return { ok: true, state: next };
}

/** autopilot.reject — reject a proposal. */
export async function reject(db: Database, proposalId: string) {
  const p = await loadProposal(db, proposalId);
  if (!p) return { ok: false, reason: "not found" };
  await setState(db, proposalId, transition(p.state, "rejected"), "user rejected");
  return { ok: true };
}

/**
 * autopilot.execute — run an APPROVED proposal: execute → verify → complete, or roll back on failure.
 * Every step is idempotent + reversible; verification confirms post-conditions before completing.
 */
export async function execute(db: Database, proposalId: string) {
  const p = await loadProposal(db, proposalId);
  if (!p) return { ok: false, reason: "not found" };
  if (!isExecutable(p.state)) return { ok: false, reason: `not approved (state ${p.state})` };

  const started = Date.now();
  await setState(db, proposalId, transition(p.state, "executing"), "execution started");
  const plan = p.plan as ExecutionPlan;
  const ctx = {
    db,
    sourceId: p.source?.id ?? null,
    refresh: async () => void (await predictionService.run(db, "UTC").catch(() => {})),
  };
  const runner = makeRunner(ctx);

  const exec = await executePlan(plan, runner, { maxAttempts: 2 }).catch(() => ({
    ok: false,
    results: [],
  }));
  await recordExecution(db, proposalId, exec.ok, exec.results, 2, Date.now() - started).catch(
    () => {},
  );

  if (!exec.ok) {
    // Deterministic rollback rather than a silent retry.
    await setState(db, proposalId, transition("executing", "failed"), "execution failed");
    const rb = await rollbackPlan(plan, runner).catch(() => ({ ok: false, results: [] }));
    await recordRollback(db, proposalId, rb.ok, rb.results).catch(() => {});
    await setState(
      db,
      proposalId,
      transition("failed", "rolled_back"),
      "rolled back after failure",
    );
    return { ok: false, rolledBack: true };
  }

  const verify = await verifyPlan(plan.verifications, makeReader(ctx)).catch(() => ({
    passed: false,
    checks: [],
  }));
  await recordVerification(db, proposalId, verify).catch(() => {});
  if (!verify.passed) {
    const rb = await rollbackPlan(plan, runner).catch(() => ({ ok: false, results: [] }));
    await recordRollback(db, proposalId, rb.ok, rb.results).catch(() => {});
    await setState(db, proposalId, transition("executing", "failed"), "verification failed");
    await setState(
      db,
      proposalId,
      transition("failed", "rolled_back"),
      "rolled back after verification failure",
    );
    return { ok: false, rolledBack: true, verified: false };
  }

  await setState(db, proposalId, transition("executing", "completed"), "completed + verified");
  return { ok: true, verified: true };
}

/** autopilot.rollback — explicitly roll back a completed proposal. */
export async function rollback(db: Database, proposalId: string) {
  const p = await loadProposal(db, proposalId);
  if (!p || p.state !== "completed")
    return { ok: false, reason: "only completed proposals can be rolled back" };
  const ctx = { db, sourceId: p.source?.id ?? null };
  const rb = await rollbackPlan(p.plan as ExecutionPlan, makeRunner(ctx)).catch(() => ({
    ok: false,
    results: [],
  }));
  await recordRollback(db, proposalId, rb.ok, rb.results).catch(() => {});
  await setState(db, proposalId, transition("completed", "rolled_back"), "manual rollback");
  return { ok: rb.ok };
}

/** autopilot.history — recent proposals + their audit trails. */
export async function history(db: Database) {
  const all = await listProposals(db).catch(() => []);
  return { proposals: completedProposals(all).slice(0, 30) };
}

/** autopilot.timeline — the audit trail for one proposal. */
export async function timeline(db: Database, proposalId: string) {
  const rows = await loadAudit(db, proposalId).catch(() => []);
  return {
    events: buildAuditTrail(
      rows.map((r) => ({ state: r.state as never, at: r.at.toISOString(), detail: r.detail })),
    ),
  };
}

/** autopilot.analytics — aggregate metrics over all proposals. */
export async function analytics(db: Database) {
  const all = await listProposals(db).catch(() => []);
  const records: ExecutionRecord[] = all.map((p) => ({
    state: p.state,
    trusted: p.policy === "trusted",
  }));
  const stats = computeAnalytics(records);
  await recordMetrics(db, stats).catch(() => {});
  return stats;
}

/** autopilot.settings — the automations + their effective policies (trustable = low-risk only). */
export async function settings(db: Database) {
  const overrides = await loadAllPolicies(db).catch(() => ({}) as Record<string, Policy>);
  const trustable = new Set(trustableAutomations(AUTOMATIONS).map((a) => a.id));
  return {
    automations: AUTOMATIONS.map((a) => {
      const decision = resolvePolicy(a, overrides[a.id]);
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        risk: a.risk,
        category: a.category,
        reversible: a.reversible,
        policy: decision.policy,
        trustable: trustable.has(a.id),
      };
    }),
  };
}

/** autopilot.setPolicy — set a per-automation policy (trust clamped to low-risk). */
export async function setPolicy(db: Database, automationId: string, policy: Policy) {
  const automation = getAutomation(automationId);
  if (!automation) return { ok: false, reason: "unknown automation" };
  const decision = resolvePolicy(automation, policy);
  await savePolicy(db, automationId, decision.policy).catch(() => {});
  return { ok: true, policy: decision.policy, reason: decision.reason };
}

/** autopilot.forChief — the executable proposals the Chief should surface (low-friction first). */
export async function forChief(db: Database, tz: string) {
  await plan(db, tz).catch(() => []);
  const all = await listProposals(db).catch(() => []);
  return chiefProposals(all);
}

/** Effective policy for one automation (helper for tests/consumers). */
export async function policyFor(db: Database, automationId: string): Promise<Policy> {
  const override = await loadPolicy(db, automationId).catch(() => null);
  const automation = getAutomation(automationId);
  return resolvePolicy(automation!, override ?? undefined).policy;
}
