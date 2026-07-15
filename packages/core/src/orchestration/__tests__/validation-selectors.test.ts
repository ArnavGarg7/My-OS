import { describe, expect, it } from "vitest";
import { isRecursive, validatePlan } from "../validation";
import {
  buildSummary,
  failedRuns,
  failedSteps,
  isFullRun,
  recoveredRuns,
  runsToday,
} from "../selectors";
import { computeSignals } from "../signals";
import { makePlan, makeRun, makeStepResult } from "../fixtures";

const now = new Date("2026-07-15T12:00:00Z");

describe("validation", () => {
  it("accepts a valid plan", () => {
    expect(validatePlan(makePlan()).valid).toBe(true);
  });

  it("flags a duplicate step", () => {
    const plan = makePlan();
    const dup = {
      ...plan,
      order: [
        ...plan.order,
        { module: "planner" as const, order: 99, mode: "refresh" as const, dependsOn: [] },
      ],
    };
    const r = validatePlan(dup);
    expect(r.issues.some((i) => i.code === "duplicate-step")).toBe(true);
  });

  it("flags repeated regeneration", () => {
    const history = Array.from({ length: 5 }, (_, i) =>
      makeRun({ id: `r${i}`, pipeline: "calendar" }),
    );
    const r = validatePlan(makePlan(), history);
    expect(r.issues.some((i) => i.code === "repeated-regeneration")).toBe(true);
  });

  it("guards against recursive orchestration", () => {
    expect(isRecursive("calendar", "calendar")).toBe(true);
    expect(isRecursive("calendar", "focus")).toBe(false);
  });
});

describe("selectors", () => {
  const history = [
    makeRun({ id: "a", status: "completed", startedAt: "2026-07-15T10:00:00Z" }),
    makeRun({ id: "b", status: "failed", startedAt: "2026-07-15T11:00:00Z", failures: 1 }),
    makeRun({ id: "c", status: "recovered", startedAt: "2026-07-14T10:00:00Z", recoveries: 2 }),
  ];

  it("runsToday filters by day", () => {
    expect(runsToday(history, now, "UTC").map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("failedRuns + recoveredRuns", () => {
    expect(failedRuns(history).map((r) => r.id)).toEqual(["b"]);
    expect(recoveredRuns(history).map((r) => r.id)).toEqual(["c"]);
  });

  it("isFullRun for a wide run", () => {
    const wide = makeRun({
      affected: [
        "calendar",
        "planner",
        "focus",
        "task",
        "decision",
        "health",
        "finance",
        "goal",
        "project",
        "inbox",
        "notification",
        "morning",
      ],
    });
    expect(isFullRun(wide)).toBe(true);
    expect(isFullRun(makeRun({ affected: ["calendar", "planner"] }))).toBe(false);
  });

  it("failedSteps returns failed steps of a run", () => {
    const run = makeRun({ steps: [makeStepResult({ outcome: "failed" }), makeStepResult()] });
    expect(failedSteps(run)).toHaveLength(1);
  });

  it("buildSummary aggregates today's runs", () => {
    const s = buildSummary(history, now, "UTC");
    expect(s.runsToday).toBe(2);
    expect(s.failuresToday).toBe(1);
    expect(s.systemReady).toBe(false); // one failed today
  });

  it("systemReady when no failures today", () => {
    const clean = [makeRun({ status: "completed", startedAt: "2026-07-15T10:00:00Z" })];
    expect(buildSummary(clean, now, "UTC").systemReady).toBe(true);
  });
});

describe("signals", () => {
  it("computes orchestration signals", () => {
    const history = [makeRun({ status: "completed", startedAt: "2026-07-15T10:00:00Z" })];
    const s = computeSignals({ history, now, timezone: "UTC", pendingPipelines: 2 });
    expect(s.healthy).toBe(true);
    expect(s.pendingPipelines).toBe(2);
    expect(s.failuresToday).toBe(0);
  });

  it("reports unhealthy when a run failed today", () => {
    const history = [makeRun({ status: "failed", startedAt: "2026-07-15T10:00:00Z", failures: 1 })];
    const s = computeSignals({ history, now, timezone: "UTC", pendingPipelines: 0 });
    expect(s.healthy).toBe(false);
    expect(s.failuresToday).toBe(1);
  });
});
