import { beforeEach, describe, expect, it } from "vitest";
import { createOrchestrationEngine, type OrchestrationEngine } from "../engine";
import { makeContext, makeCounterId, makeRun, makeStepResult, resetCounter } from "../fixtures";

function engineAt(iso: string): OrchestrationEngine {
  return createOrchestrationEngine(makeCounterId("o"), () => new Date(iso));
}

describe("OrchestrationEngine", () => {
  beforeEach(() => resetCounter());

  it("makes a trigger from a known event", () => {
    const engine = engineAt("2026-07-15T12:00:00Z");
    const trigger = engine.makeTrigger("calendar.meeting_added", "automation");
    expect(trigger?.pipeline).toBe("calendar");
    expect(trigger?.source).toBe("automation");
    expect(trigger?.id).toBe("o-1");
  });

  it("returns null for an unknown event", () => {
    const engine = engineAt("2026-07-15T12:00:00Z");
    expect(engine.makeTrigger("nope.event", "manual")).toBeNull();
  });

  it("plans + previews a pipeline", () => {
    const engine = engineAt("2026-07-15T12:00:00Z");
    const trigger = engine.makeTrigger("finance.budget_exceeded", "module")!;
    const plan = engine.plan(trigger, makeContext());
    expect(plan.affected).toContain("decision");
    const preview = engine.preview("finance.budget_exceeded", makeContext());
    expect(preview?.pipeline).toBe("finance");
  });

  it("validates + schedules", () => {
    const engine = engineAt("2026-07-15T12:00:00Z");
    const trigger = engine.makeTrigger("calendar.meeting_added", "manual")!;
    const plan = engine.plan(trigger, makeContext());
    expect(engine.validate(plan, []).valid).toBe(true);
    expect(engine.schedule(trigger, []).decision).toBe("run");
  });

  it("detects conflicts + canProceed", () => {
    const engine = engineAt("2026-07-15T12:00:00Z");
    const trigger = engine.makeTrigger("calendar.meeting_added", "manual")!;
    const plan = engine.plan(trigger, makeContext());
    expect(engine.canProceed(plan, [])).toBe(true);
    expect(engine.canProceed(plan, [plan])).toBe(false);
  });

  it("produces a recovery decision", () => {
    const engine = engineAt("2026-07-15T12:00:00Z");
    const trigger = engine.makeTrigger("calendar.meeting_added", "manual")!;
    const plan = engine.plan(trigger, makeContext());
    expect(engine.recovery("planner", plan, 0).strategy).toBe("retry_step");
  });

  it("assembles a run from step results", () => {
    const engine = engineAt("2026-07-15T12:00:00.200Z");
    const trigger = engine.makeTrigger("calendar.meeting_added", "manual")!;
    const plan = engine.plan(trigger, makeContext());
    const run = engine.assemble(
      trigger,
      plan,
      [makeStepResult()],
      new Date("2026-07-15T12:00:00Z"),
    );
    expect(run.pipeline).toBe("calendar");
    expect(run.status).toBe("completed");
  });

  it("computes summary + signals", () => {
    const engine = engineAt("2026-07-15T12:00:00Z");
    const history = [makeRun({ status: "completed", startedAt: "2026-07-15T10:00:00Z" })];
    expect(engine.summary(history, "UTC").systemReady).toBe(true);
    expect(engine.signals(history, "UTC", 1).pendingPipelines).toBe(1);
  });
});
