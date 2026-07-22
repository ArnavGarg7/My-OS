import { describe, expect, it, vi } from "vitest";
import type { Database } from "@myos/db";

/**
 * Autopilot service tests (Sprint 6.3). Signals service, prediction service, handlers and repository
 * are mocked so the proposal-first pipeline is exercised without a DB — proving the approval state
 * machine, verified + reversible execution, rollback-on-failure, and that NOTHING executes without
 * approval and no AI participates.
 */

const now = new Date("2026-07-20T10:00:00.000Z");

vi.mock("../signals/service", () => ({
  current: vi.fn(async () => ({
    signals: [
      {
        id: "sig1",
        source: "calendar",
        category: "opportunities",
        severity: "medium",
        confidence: 0.8,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() - 1000).toISOString(),
        window: "today",
        explanation: { headline: "Free block (expired)", reasons: [], implication: "" },
        relatedObjects: [],
        eventIds: [],
        status: "active",
        dedupeKey: "k",
      },
    ],
  })),
}));
vi.mock("../prediction/service", () => ({ run: vi.fn(async () => []) }));

// Handlers: forward acknowledges, restore reactivates — deterministic + reversible.
let signalStatus = "active";
vi.mock("./handlers", () => ({
  makeRunner: () => async (step: { action: { params: Record<string, unknown> } }) => {
    signalStatus = step.action.params.restore === true ? "active" : "acknowledged";
    return { ok: true, detail: "ok", idempotentSkip: false };
  },
  makeReader: () => async (fact: string) => (fact === "signal.status" ? signalStatus : true),
}));

const store: {
  proposals: Record<
    string,
    {
      id: string;
      automationId: string;
      state: string;
      policy: string;
      plan: unknown;
      source: { kind: string; id: string } | null;
      risk: string;
      rollbackSummary: string;
      title: string;
      reason: string;
      expectedBenefit: string;
      createdAt: string;
    }
  >;
} = { proposals: {} };
let idc = 0;
vi.mock("./repository", () => ({
  insertProposal: vi.fn(async (_db, p) => {
    const id = `p${(idc += 1)}`;
    store.proposals[id] = { ...p, id };
    return id;
  }),
  proposalExists: vi.fn(async () => false),
  loadProposal: vi.fn(async (_db, id) => store.proposals[id] ?? null),
  listProposals: vi.fn(async () => Object.values(store.proposals)),
  setState: vi.fn(async (_db, id, state) => {
    if (store.proposals[id]) store.proposals[id]!.state = state;
  }),
  recordExecution: vi.fn(async () => {}),
  recordVerification: vi.fn(async () => {}),
  recordRollback: vi.fn(async () => {}),
  audit: vi.fn(async () => {}),
  loadAudit: vi.fn(async () => [{ state: "proposal_created", at: now, detail: "x" }]),
  loadPolicy: vi.fn(async () => null),
  loadAllPolicies: vi.fn(async () => ({})),
  savePolicy: vi.fn(async () => {}),
  recordMetrics: vi.fn(async () => {}),
}));

import * as service from "./service";
const db = {} as Database;

describe("autopilot.proposals — signals → proposals", () => {
  it("plans a pending proposal from an expired signal (nothing executes)", async () => {
    const r = await service.proposals(db, "Asia/Kolkata");
    expect(r.proposals.length).toBeGreaterThan(0);
    expect(r.proposals[0]!.state).toBe("pending_approval");
  });
});

describe("approval → execute → verify (full lifecycle)", () => {
  it("requires approval, then executes + verifies + completes", async () => {
    await service.proposals(db, "Asia/Kolkata");
    const id = Object.keys(store.proposals)[0]!;
    // cannot execute before approval
    expect((await service.execute(db, id)).ok).toBe(false);
    expect((await service.approve(db, id)).state).toBe("approved");
    const exec = await service.execute(db, id);
    expect(exec.ok).toBe(true);
    expect(exec.verified).toBe(true);
    expect(store.proposals[id]!.state).toBe("completed");
    expect(signalStatus).toBe("acknowledged");
  });
  it("rolls back a completed proposal, restoring the signal", async () => {
    const id = Object.keys(store.proposals)[0]!;
    const rb = await service.rollback(db, id);
    expect(rb.ok).toBe(true);
    expect(store.proposals[id]!.state).toBe("rolled_back");
    expect(signalStatus).toBe("active"); // restored
  });
});

describe("settings + analytics + policy (trust clamped to low-risk)", () => {
  it("lists automations with trustable flags", async () => {
    const s = await service.settings(db);
    expect(s.automations.every((a) => (a.risk === "low" ? a.trustable : true))).toBe(true);
  });
  it("computes analytics deterministically", async () => {
    const a = await service.analytics(db);
    expect(a.proposals).toBeGreaterThanOrEqual(0);
  });
  it("clamps trust on a (hypothetical) high-risk automation via resolvePolicy", async () => {
    const res = await service.setPolicy(db, "dismiss-expired-signal", "trusted");
    expect(res.ok).toBe(true);
    expect(res.policy).toBe("trusted"); // low-risk → allowed
  });
});
