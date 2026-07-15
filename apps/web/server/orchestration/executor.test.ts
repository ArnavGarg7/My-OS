import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  plannerGenerate: vi.fn(),
  decisionGenerate: vi.fn(),
  notifGenerate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../planner/service", () => ({ generate: h.plannerGenerate }));
vi.mock("../decision/service", () => ({ generate: h.decisionGenerate }));
vi.mock("../notification/service", () => ({ generate: h.notifGenerate }));

import { executePlan } from "./executor";
import { makePlan } from "@myos/core/orchestration";

const ctx = {
  db: {} as never,
  tz: "UTC",
  prefs: { preferredStartOfDay: "09:00", preferredEndOfDay: "17:00" },
};

// Deterministic clock: advances 10ms per call so runtimeMs is stable/non-negative.
function fixedClock(startMs = 0, stepMs = 10) {
  let t = startMs;
  return () => new Date((t += stepMs));
}

beforeEach(() => {
  vi.clearAllMocks();
  h.plannerGenerate.mockResolvedValue({});
  h.decisionGenerate.mockResolvedValue([{ id: "d1" }]);
  h.notifGenerate.mockResolvedValue({ created: 1, delivered: 1, suppressed: 0 });
});

describe("executePlan", () => {
  it("runs every step of the calendar pipeline in order", async () => {
    const plan = makePlan();
    const res = await executePlan(plan, ctx, fixedClock());
    expect(res.steps.map((s) => s.module)).toEqual(plan.order.map((s) => s.module));
    expect(res.failures).toHaveLength(0);
    expect(res.steps.every((s) => s.outcome === "completed")).toBe(true);
  });

  it("dispatches regenerate steps to the real services", async () => {
    await executePlan(makePlan(), ctx, fixedClock());
    expect(h.plannerGenerate).toHaveBeenCalledWith(ctx.db, "UTC", ctx.prefs);
    expect(h.decisionGenerate).toHaveBeenCalledWith(ctx.db, "UTC", ctx.prefs);
    expect(h.notifGenerate).toHaveBeenCalledWith(ctx.db, "UTC");
  });

  it("does not call a service for record/refresh acknowledgement steps", async () => {
    // A single-step plan whose only module is a non-regenerating one.
    const plan = makePlan({
      order: [{ module: "morning", order: 0, mode: "refresh", dependsOn: [] }],
    });
    const res = await executePlan(plan, ctx, fixedClock());
    expect(res.steps[0]!.outcome).toBe("completed");
    expect(h.plannerGenerate).not.toHaveBeenCalled();
  });

  it("records non-negative runtime for each step", async () => {
    const res = await executePlan(makePlan(), ctx, fixedClock());
    expect(res.steps.every((s) => (s.runtimeMs ?? 0) >= 0)).toBe(true);
  });

  it("recovers a failed planner step by retrying then degrading", async () => {
    h.plannerGenerate.mockRejectedValue(new Error("planner boom"));
    const res = await executePlan(makePlan(), ctx, fixedClock());
    // planner default recovery is retry_step; after MAX retries it degrades and records a failure/recovery.
    const plannerStep = res.steps.find((s) => s.module === "planner");
    expect(plannerStep).toBeDefined();
    expect(["recovered", "failed"]).toContain(plannerStep!.outcome);
    expect(res.failures.some((f) => f.module === "planner")).toBe(true);
    // planner retried MAX_STEP_RETRIES + 1 times.
    expect(h.plannerGenerate.mock.calls.length).toBeGreaterThan(1);
  });

  it("does not cascade — downstream steps still run after a recovered failure", async () => {
    h.decisionGenerate.mockImplementationOnce(() => {
      throw new Error("decision boom");
    });
    const res = await executePlan(makePlan(), ctx, fixedClock());
    // notification (downstream of decision) still executed.
    expect(res.steps.some((s) => s.module === "notification")).toBe(true);
  });

  it("with no failures, nothing is skipped", async () => {
    const res = await executePlan(makePlan(), ctx, fixedClock());
    expect(res.steps.some((s) => s.outcome === "skipped")).toBe(false);
  });

  it("retries a retry_step failure then degrades to skip at the attempt cap", async () => {
    h.plannerGenerate.mockRejectedValue(new Error("planner boom"));
    await executePlan(makePlan(), ctx, fixedClock());
    // planner default is retry_step; core degrades to skip once attempts >= MAX_STEP_RETRIES (2).
    expect(h.plannerGenerate.mock.calls.length).toBe(2);
  });

  it("records a recovery decision for each failed step", async () => {
    h.decisionGenerate.mockRejectedValue(new Error("decision boom"));
    const res = await executePlan(makePlan(), ctx, fixedClock());
    expect(res.recoveries.some((r) => r.module === "decision")).toBe(true);
  });

  it("marks recovered failures as recovered:true in the failures list", async () => {
    h.decisionGenerate.mockRejectedValue(new Error("decision boom"));
    const res = await executePlan(makePlan(), ctx, fixedClock());
    const f = res.failures.find((x) => x.module === "decision");
    expect(f?.recovered).toBe(true);
  });

  it("routes a decision refresh-mode step to the decision service", async () => {
    const plan = makePlan({
      order: [{ module: "decision", order: 0, mode: "refresh", dependsOn: [] }],
    });
    const res = await executePlan(plan, ctx, fixedClock());
    expect(h.decisionGenerate).toHaveBeenCalledWith(ctx.db, "UTC", ctx.prefs);
    expect(res.steps[0]!.detail).toContain("refreshed");
  });

  it("accumulates independent failures from multiple failing steps", async () => {
    h.plannerGenerate.mockRejectedValue(new Error("planner boom"));
    h.decisionGenerate.mockRejectedValue(new Error("decision boom"));
    const res = await executePlan(makePlan(), ctx, fixedClock());
    const modules = res.failures.map((f) => f.module);
    expect(modules).toContain("planner");
    expect(modules).toContain("decision");
  });
});
