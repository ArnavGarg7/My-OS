import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRecord, makeRule } from "@myos/core/automation";

const h = vi.hoisted(() => ({
  list: vi.fn(),
  allHistory: vi.fn(),
  listHistory: vi.fn(),
  upsertStatistics: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import { automationSignals } from "./signals";
import { portfolio, ruleStatistics } from "./statistics";

const db = {} as never;
const NOW = new Date("2026-07-15T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  h.list.mockResolvedValue([]);
  h.allHistory.mockResolvedValue([]);
  h.listHistory.mockResolvedValue([]);
  h.upsertStatistics.mockResolvedValue(undefined);
});

describe("automationSignals", () => {
  it("reports enabled rules + failures", async () => {
    h.list.mockResolvedValue([makeRule({ status: "enabled" })]);
    h.allHistory.mockResolvedValue([
      makeRecord({ outcome: "failed", triggeredAt: "2026-07-15T09:00:00Z" }),
    ]);
    const s = await automationSignals(db, "UTC", NOW);
    expect(s.enabledRules).toBe(1);
    expect(s.failuresToday).toBe(1);
    expect(s.runawayRule).toBe(false);
  });

  it("detects a runaway rule", async () => {
    h.list.mockResolvedValue([makeRule({ id: "r1", status: "enabled" })]);
    h.allHistory.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) =>
        makeRecord({
          id: `m${i}`,
          ruleId: "r1",
          outcome: "completed",
          triggeredAt: "2026-07-15T09:00:00Z",
        }),
      ),
    );
    const s = await automationSignals(db, "UTC", NOW);
    expect(s.runawayRule).toBe(true);
  });
});

describe("statistics", () => {
  it("computes + caches per-rule statistics", async () => {
    h.listHistory.mockResolvedValue([
      makeRecord({ ruleId: "r1", outcome: "completed", runtimeMs: 1000 }),
      makeRecord({ id: "e2", ruleId: "r1", outcome: "failed", runtimeMs: null }),
    ]);
    const stats = await ruleStatistics(db, "r1");
    expect(stats.successes).toBe(1);
    expect(stats.failures).toBe(1);
    expect(stats.failureRate).toBe(50);
    expect(h.upsertStatistics).toHaveBeenCalled();
  });

  it("builds a portfolio", async () => {
    h.list.mockResolvedValue([makeRule({ id: "r1", status: "enabled" })]);
    h.allHistory.mockResolvedValue([
      makeRecord({ ruleId: "r1", outcome: "completed", triggeredAt: "2026-07-15T09:00:00Z" }),
    ]);
    const p = await portfolio(db, "UTC", NOW);
    expect(p.enabledRules).toBe(1);
    expect(p.executionsToday).toBe(1);
    expect(p.mostTriggeredRuleId).toBe("r1");
  });

  it("returns zeroed stats for a rule with no history", async () => {
    h.listHistory.mockResolvedValue([]);
    const stats = await ruleStatistics(db, "r-empty");
    expect(stats.executions).toBe(0);
    expect(stats.failureRate).toBe(0);
  });
});
