import { describe, expect, it } from "vitest";
import { buildPortfolio, statsForRule } from "../statistics";
import { computeSignals } from "../signals";
import { buildSummary } from "../selectors";
import { makeRecord, makeRule } from "../fixtures";
import type { ExecutionRecord } from "../types";

const now = new Date("2026-07-15T12:00:00Z");

function history(): ExecutionRecord[] {
  return [
    makeRecord({
      id: "e1",
      ruleId: "r1",
      outcome: "completed",
      runtimeMs: 1000,
      triggeredAt: "2026-07-15T09:00:00Z",
    }),
    makeRecord({
      id: "e2",
      ruleId: "r1",
      outcome: "failed",
      runtimeMs: null,
      triggeredAt: "2026-07-15T10:00:00Z",
    }),
    makeRecord({ id: "e3", ruleId: "r1", outcome: "skipped", triggeredAt: "2026-07-15T10:30:00Z" }),
    makeRecord({
      id: "e4",
      ruleId: "r2",
      outcome: "completed",
      runtimeMs: 3000,
      triggeredAt: "2026-07-15T11:00:00Z",
    }),
  ];
}

describe("statistics", () => {
  it("computes per-rule stats", () => {
    const s = statsForRule("r1", history());
    expect(s.executions).toBe(2); // completed + failed
    expect(s.successes).toBe(1);
    expect(s.failures).toBe(1);
    expect(s.skipped).toBe(1);
    expect(s.failureRate).toBe(50);
    expect(s.averageRuntimeMs).toBe(1000);
  });

  it("returns zeroed stats for an unknown rule", () => {
    const s = statsForRule("nope", history());
    expect(s.executions).toBe(0);
    expect(s.failureRate).toBe(0);
  });

  it("builds a portfolio", () => {
    const rules = [
      makeRule({ id: "r1", status: "enabled" }),
      makeRule({ id: "r2", status: "disabled" }),
    ];
    const p = buildPortfolio(rules, history(), now, "UTC");
    expect(p.totalRules).toBe(2);
    expect(p.enabledRules).toBe(1);
    expect(p.executionsToday).toBe(3); // 2 completed + 1 failed (skipped excluded)
    expect(p.successesToday).toBe(2);
    expect(p.failuresToday).toBe(1);
    expect(p.mostTriggeredRuleId).toBe("r1");
  });

  it("summary reflects enabled + failed + executed", () => {
    const rules = [makeRule({ id: "r1", status: "enabled" })];
    const s = buildSummary(rules, history(), now, "UTC");
    expect(s.enabledRules).toBe(1);
    expect(s.failedToday).toBe(1);
    expect(s.executedToday).toBe(3);
  });

  it("signals detect no runaway under threshold", () => {
    const rules = [makeRule({ id: "r1", status: "enabled" })];
    const s = computeSignals({ rules, history: history(), now, timezone: "UTC" });
    expect(s.runawayRule).toBe(false);
    expect(s.enabledRules).toBe(1);
    expect(s.failuresToday).toBe(1);
  });

  it("signals detect a runaway rule", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      makeRecord({
        id: `m${i}`,
        ruleId: "r1",
        outcome: "completed",
        triggeredAt: "2026-07-15T09:00:00Z",
      }),
    );
    const s = computeSignals({
      rules: [makeRule({ id: "r1" })],
      history: many,
      now,
      timezone: "UTC",
    });
    expect(s.runawayRule).toBe(true);
  });
});
