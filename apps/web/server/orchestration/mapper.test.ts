import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { failureRowToFailure, runRowToRun, runToColumns, stepRowToResult } from "./mapper";
import { makeRun } from "@myos/core/orchestration";
import type {
  OrchestrationFailureRow,
  OrchestrationRunRow,
  OrchestrationStepRow,
} from "@myos/db/schema";

const runRow: OrchestrationRunRow = {
  id: "run-1",
  pipeline: "calendar",
  trigger: "calendar.meeting_added",
  source: "manual",
  status: "completed",
  startedAt: new Date("2026-07-15T11:59:00Z"),
  completedAt: new Date("2026-07-15T11:59:00.200Z"),
  runtimeMs: 200,
  affected: ["calendar", "planner"],
  skipped: [],
  failures: 0,
  recoveries: 0,
  summary: "calendar: 2 completed",
};

const stepRows: OrchestrationStepRow[] = [
  {
    id: "s2",
    runId: "run-1",
    module: "planner",
    stepOrder: 1,
    outcome: "completed",
    mode: "regenerate",
    runtimeMs: 20,
    detail: "planner regenerated",
  },
  {
    id: "s1",
    runId: "run-1",
    module: "calendar",
    stepOrder: 0,
    outcome: "completed",
    mode: "record",
    runtimeMs: 5,
    detail: null,
  },
];

describe("orchestration mappers", () => {
  it("maps a step row to a result", () => {
    const r = stepRowToResult(stepRows[0]!);
    expect(r.module).toBe("planner");
    expect(r.outcome).toBe("completed");
    expect(r.mode).toBe("regenerate");
    expect(r.detail).toBe("planner regenerated");
  });

  it("omits detail when null", () => {
    const r = stepRowToResult(stepRows[1]!);
    expect(r.detail).toBeUndefined();
  });

  it("maps a run row + steps to the domain, sorting steps by order", () => {
    const run = runRowToRun(runRow, stepRows);
    expect(run.id).toBe("run-1");
    expect(run.pipeline).toBe("calendar");
    expect(run.status).toBe("completed");
    expect(run.startedAt).toBe("2026-07-15T11:59:00.000Z");
    expect(run.completedAt).toBe("2026-07-15T11:59:00.200Z");
    expect(run.steps.map((s) => s.module)).toEqual(["calendar", "planner"]);
    expect(run.affected).toEqual(["calendar", "planner"]);
  });

  it("handles a null completedAt", () => {
    const run = runRowToRun({ ...runRow, completedAt: null }, []);
    expect(run.completedAt).toBeNull();
    expect(run.steps).toHaveLength(0);
  });

  it("maps a domain run back to columns", () => {
    const cols = runToColumns(makeRun());
    expect(cols.pipeline).toBe("calendar");
    expect(cols.startedAt).toBeInstanceOf(Date);
    expect(cols.completedAt).toBeInstanceOf(Date);
    expect(cols.summary).toContain("calendar");
  });

  it("maps a run with null completedAt back to columns", () => {
    const cols = runToColumns(makeRun({ completedAt: null, runtimeMs: null }));
    expect(cols.completedAt).toBeNull();
    expect(cols.runtimeMs).toBeNull();
  });

  it("maps a failure row to the domain", () => {
    const row: OrchestrationFailureRow = {
      id: "f1",
      runId: "run-1",
      module: "planner",
      error: "boom",
      strategy: "retry_step",
      recovered: true,
      at: new Date("2026-07-15T11:59:00Z"),
    };
    const f = failureRowToFailure(row);
    expect(f.module).toBe("planner");
    expect(f.error).toBe("boom");
    expect(f.strategy).toBe("retry_step");
    expect(f.recovered).toBe(true);
  });
});
