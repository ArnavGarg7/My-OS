import { describe, expect, it } from "vitest";
import {
  AUTOMATIONS,
  getAutomation,
  evaluateConditions,
  buildExecutionPlan,
  buildRollbackPlan,
  isFullyReversible,
  factsFromSignal,
  planFromSignals,
  canTransition,
  transition,
  initialState,
  isExecutable,
  executePlan,
  verifyPlan,
  rollbackPlan,
  resolvePolicy,
  trustableAutomations,
  computeAnalytics,
  buildAuditTrail,
  pendingProposals,
  proposalCounts,
  type ExecutionStep,
} from "./index";
import type { Signal } from "../events/types";

/**
 * Proposal-First Automation Engine (Sprint 6.3). Deterministic: signals → proposals → approval →
 * execution → verify → rollback. Reversible, idempotent, auditable. No AI executes; nothing runs
 * without approval (or an explicit trusted policy). All time injected.
 */

let n = 0;
const newId = () => `a${(n += 1)}`;
const now = new Date("2026-07-20T10:00:00.000Z");
const deps = { newId, now };

const expiredSignal = (over: Partial<Signal> = {}): Signal => ({
  id: "sig1",
  source: "calendar",
  category: "opportunities",
  severity: "medium",
  confidence: 0.8,
  createdAt: now.toISOString(),
  expiresAt: new Date(now.getTime() - 1000).toISOString(), // expired
  window: "today",
  explanation: { headline: "Free block (expired)", reasons: [], implication: "" },
  relatedObjects: [],
  eventIds: [],
  status: "active",
  dedupeKey: "k",
  ...over,
});

describe("registry — only low-risk reversible automations", () => {
  it("every registered automation is low-risk and reversible in 6.3", () => {
    expect(AUTOMATIONS.length).toBeGreaterThan(0);
    expect(AUTOMATIONS.every((a) => a.risk === "low" && a.reversible)).toBe(true);
  });
});

describe("conditions", () => {
  it("evaluates ALL conditions against signal facts", () => {
    const facts = factsFromSignal(expiredSignal(), now);
    expect(facts["signal.expired"]).toBe(true);
    expect(evaluateConditions([{ fact: "signal.expired", op: "eq", value: true }], facts)).toBe(
      true,
    );
    expect(evaluateConditions([{ fact: "signal.category", op: "eq", value: "risks" }], facts)).toBe(
      false,
    );
  });
});

describe("execution plan + rollback (must exist before execution)", () => {
  it("builds an ordered plan with an inverse for every mutating step", () => {
    const a = getAutomation("dismiss-expired-signal")!;
    const plan = buildExecutionPlan(a, deps);
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0]!.rollback).not.toBeNull();
    expect(isFullyReversible(plan)).toBe(true);
    expect(plan.verifications.length).toBeGreaterThan(0);
    const rb = buildRollbackPlan(plan);
    expect(rb.length).toBe(1);
  });
  it("refuses to plan a mutating action with no inverse", () => {
    const bad = {
      ...getAutomation("dismiss-expired-signal")!,
      actions: [{ kind: "move_task" as never, label: "Move", params: {}, mutating: true }],
    };
    expect(() => buildExecutionPlan(bad, deps)).toThrow();
  });
});

describe("planner — signals → proposals", () => {
  it("proposes the dismiss-expired automation for an expired signal", () => {
    const proposals = planFromSignals([expiredSignal()], deps);
    expect(proposals.length).toBeGreaterThan(0);
    const p = proposals.find((x) => x.automationId === "dismiss-expired-signal")!;
    expect(p.state).toBe("pending_approval"); // default policy always_ask
    expect(p.rollbackSummary.length).toBeGreaterThan(0);
    expect(p.source).toEqual({ kind: "signal", id: "sig1" });
  });
  it("does not propose for a non-expired signal", () => {
    const fresh = expiredSignal({ expiresAt: new Date(now.getTime() + 3600_000).toISOString() });
    expect(
      planFromSignals([fresh], deps).some((p) => p.automationId === "dismiss-expired-signal"),
    ).toBe(false);
  });
});

describe("approval state machine — no hidden transitions", () => {
  it("only allows legal transitions", () => {
    expect(canTransition("pending_approval", "approved")).toBe(true);
    expect(canTransition("pending_approval", "executing")).toBe(false);
    expect(canTransition("approved", "executing")).toBe(true);
    expect(() => transition("completed", "executing")).toThrow();
  });
  it("trusted → approved initial state; others wait", () => {
    expect(initialState("trusted")).toBe("approved");
    expect(initialState("always_ask")).toBe("pending_approval");
    expect(isExecutable("approved")).toBe(true);
    expect(isExecutable("pending_approval")).toBe(false);
  });
});

describe("policy — trust only for low-risk", () => {
  it("honours trust for low-risk, forces approval for higher risk", () => {
    const low = getAutomation("dismiss-expired-signal")!;
    expect(resolvePolicy(low, "trusted").policy).toBe("trusted");
    const high = { ...low, risk: "high" as const };
    expect(resolvePolicy(high, "trusted").requiresApproval).toBe(true);
    expect(trustableAutomations(AUTOMATIONS).length).toBe(AUTOMATIONS.length);
  });
});

describe("execution + verification + rollback (injected handlers)", () => {
  const a = getAutomation("dismiss-expired-signal")!;
  const plan = buildExecutionPlan(a, deps);
  it("executes steps, verifies post-conditions, and rolls back on demand", async () => {
    const applied: string[] = [];
    const run = async (step: ExecutionStep) => {
      applied.push(step.action.label);
      return { ok: true, detail: "ok", idempotentSkip: false };
    };
    const exec = await executePlan(plan, run);
    expect(exec.ok).toBe(true);
    const verify = await verifyPlan(plan.verifications, async () => "acknowledged");
    expect(verify.passed).toBe(true);
    const rb = await rollbackPlan(plan, run);
    expect(rb.ok).toBe(true);
    expect(applied.some((l) => l.startsWith("Restore"))).toBe(true);
  });
  it("retries a failing step then stops, leaving it for rollback", async () => {
    let calls = 0;
    const run = async () => {
      calls += 1;
      return { ok: false, detail: "boom" };
    };
    const exec = await executePlan(plan, run, { maxAttempts: 2 });
    expect(exec.ok).toBe(false);
    expect(calls).toBe(2); // retried once
    const verify = await verifyPlan(plan.verifications, async () => "active");
    expect(verify.passed).toBe(false);
  });
});

describe("audit + analytics", () => {
  it("builds an immutable lifecycle trail", () => {
    const trail = buildAuditTrail([
      { state: "proposal_created", at: now.toISOString() },
      { state: "approved", at: now.toISOString() },
      { state: "completed", at: now.toISOString() },
    ]);
    expect(trail.map((e) => e.state)).toEqual(["proposal_created", "approved", "completed"]);
  });
  it("computes rates deterministically", () => {
    const stats = computeAnalytics([
      { state: "completed", trusted: false },
      { state: "completed", trusted: true },
      { state: "rolled_back", trusted: false },
      { state: "pending_approval", trusted: false },
    ]);
    expect(stats.executed).toBe(2);
    expect(stats.rolledBack).toBe(1);
    expect(stats.trustedUsage).toBe(1);
    expect(stats.executionSuccessRate).toBeGreaterThan(0);
  });
});

describe("selectors", () => {
  it("buckets proposals by state", () => {
    const proposals = planFromSignals([expiredSignal()], deps);
    expect(pendingProposals(proposals).length).toBeGreaterThan(0);
    expect(proposalCounts(proposals).pending).toBe(pendingProposals(proposals).length);
  });
});
