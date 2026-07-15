import { describe, expect, it } from "vitest";
import { assembleRun, planForEvent, planForTrigger } from "../orchestrator";
import { scheduleRun } from "../scheduler";
import { canProceed, detectConflicts, regeneratedModules } from "../conflicts";
import { makeContext, makePlan, makeRun, makeStepResult, makeTriggerFixture } from "../fixtures";

describe("orchestrator", () => {
  it("plans for a trigger", () => {
    const plan = planForTrigger(makeTriggerFixture(), makeContext());
    expect(plan.pipeline).toBe("calendar");
    expect(plan.order.length).toBeGreaterThan(0);
  });

  it("plans for an event string", () => {
    expect(planForEvent("focus.completed", makeContext())?.pipeline).toBe("focus");
    expect(planForEvent("nope.event", makeContext())).toBeNull();
  });

  it("assembles a completed run", () => {
    const trigger = makeTriggerFixture();
    const plan = makePlan();
    const steps = [makeStepResult({ module: "calendar" }), makeStepResult({ module: "planner" })];
    const run = assembleRun(
      "run-1",
      trigger,
      plan,
      steps,
      new Date("2026-07-15T12:00:00Z"),
      new Date("2026-07-15T12:00:00.150Z"),
    );
    expect(run.status).toBe("completed");
    expect(run.runtimeMs).toBe(150);
    expect(run.failures).toBe(0);
  });

  it("assembles a failed run", () => {
    const run = assembleRun(
      "r",
      makeTriggerFixture(),
      makePlan(),
      [makeStepResult({ outcome: "failed" })],
      new Date("2026-07-15T12:00:00Z"),
      new Date("2026-07-15T12:00:00.100Z"),
    );
    expect(run.status).toBe("failed");
    expect(run.failures).toBe(1);
  });

  it("assembles a recovered run", () => {
    const run = assembleRun(
      "r",
      makeTriggerFixture(),
      makePlan(),
      [makeStepResult({ outcome: "recovered" })],
      new Date("2026-07-15T12:00:00Z"),
      new Date("2026-07-15T12:00:00.100Z"),
    );
    expect(run.status).toBe("recovered");
    expect(run.recoveries).toBe(1);
  });
});

describe("scheduler", () => {
  const now = new Date("2026-07-15T12:00:00Z");

  it("runs when there is no recent identical run", () => {
    expect(scheduleRun("calendar", "calendar.meeting_added", now, []).decision).toBe("run");
  });

  it("dedups an identical run within the window", () => {
    const recent = makeRun({
      pipeline: "calendar",
      trigger: "calendar.meeting_added",
      startedAt: "2026-07-15T11:59:58Z",
    });
    expect(scheduleRun("calendar", "calendar.meeting_added", now, [recent]).decision).toBe("dedup");
  });

  it("runs again after the dedup window", () => {
    const old = makeRun({
      pipeline: "calendar",
      trigger: "calendar.meeting_added",
      startedAt: "2026-07-15T11:00:00Z",
    });
    expect(scheduleRun("calendar", "calendar.meeting_added", now, [old]).decision).toBe("run");
  });
});

describe("conflicts", () => {
  it("detects two pipelines regenerating the same module", () => {
    const a = makePlan(); // calendar → planner regenerate
    const b = makePlan();
    expect(detectConflicts(a, [b]).some((c) => c.module === "planner")).toBe(true);
    expect(canProceed(a, [b])).toBe(false);
  });

  it("no conflict against an empty in-flight set", () => {
    expect(canProceed(makePlan(), [])).toBe(true);
  });

  it("regeneratedModules lists regenerate-mode steps", () => {
    expect(regeneratedModules(makePlan())).toContain("planner");
  });
});
