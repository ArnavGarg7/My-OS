import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ listRuns: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({ listRuns: h.listRuns }));

import { statistics, summary } from "./summary";
import { makeRun } from "@myos/core/orchestration";

const db = {} as never;

beforeEach(() => vi.clearAllMocks());

describe("orchestration summary", () => {
  it("summarises an empty history as ready", async () => {
    h.listRuns.mockResolvedValue([]);
    const s = await summary(db, "UTC");
    expect(s.runsToday).toBe(0);
    expect(s.systemReady).toBe(true);
    expect(s.lastRunAt).toBeNull();
  });

  it("reports the last run status + affected count", async () => {
    const today = new Date().toISOString();
    h.listRuns.mockResolvedValue([
      makeRun({
        startedAt: today,
        status: "completed",
        affected: ["calendar", "planner", "decision"],
      }),
    ]);
    const s = await summary(db, "UTC");
    expect(s.runsToday).toBe(1);
    expect(s.affectedModulesLastRun).toBe(3);
    expect(s.systemReady).toBe(true);
  });

  it("marks the system not ready when a run failed today", async () => {
    const today = new Date().toISOString();
    h.listRuns.mockResolvedValue([makeRun({ startedAt: today, status: "failed" })]);
    const s = await summary(db, "UTC");
    expect(s.failuresToday).toBe(1);
    expect(s.systemReady).toBe(false);
  });
});

describe("orchestration statistics", () => {
  it("aggregates totals + per-pipeline breakdown", async () => {
    const today = new Date().toISOString();
    h.listRuns.mockResolvedValue([
      makeRun({ pipeline: "calendar", status: "completed", runtimeMs: 100, startedAt: today }),
      makeRun({ pipeline: "calendar", status: "failed", runtimeMs: 200, startedAt: today }),
      makeRun({ pipeline: "health", status: "recovered", runtimeMs: 300, startedAt: today }),
    ]);
    const stats = await statistics(db, "UTC");
    expect(stats.totalRuns).toBe(3);
    expect(stats.runsToday).toBe(3);
    expect(stats.failedRuns).toBe(1);
    expect(stats.recoveredRuns).toBe(1);
    expect(stats.avgRuntimeMs).toBe(200);
    const calendar = stats.byPipeline.find((p) => p.pipeline === "calendar");
    expect(calendar).toEqual({ pipeline: "calendar", runs: 2, failures: 1 });
  });

  it("handles an empty history", async () => {
    h.listRuns.mockResolvedValue([]);
    const stats = await statistics(db, "UTC");
    expect(stats.totalRuns).toBe(0);
    expect(stats.avgRuntimeMs).toBe(0);
    expect(stats.byPipeline).toEqual([]);
  });

  it("counts full runs (>= 75% of modules affected)", async () => {
    const allModules = Array.from({ length: 12 }, (_, i) => `m${i}`);
    h.listRuns.mockResolvedValue([
      makeRun({ affected: allModules as never }),
      makeRun({ affected: ["calendar", "planner"] }),
    ]);
    const stats = await statistics(db, "UTC");
    expect(stats.fullRuns).toBe(1);
  });

  it("sorts the per-pipeline breakdown by run count desc", async () => {
    h.listRuns.mockResolvedValue([
      makeRun({ pipeline: "calendar" }),
      makeRun({ pipeline: "calendar" }),
      makeRun({ pipeline: "health" }),
    ]);
    const stats = await statistics(db, "UTC");
    expect(stats.byPipeline[0]!.pipeline).toBe("calendar");
    expect(stats.byPipeline[0]!.runs).toBe(2);
  });

  it("ignores zero runtimes when averaging", async () => {
    h.listRuns.mockResolvedValue([makeRun({ runtimeMs: 0 }), makeRun({ runtimeMs: 100 })]);
    const stats = await statistics(db, "UTC");
    expect(stats.avgRuntimeMs).toBe(100);
  });
});
