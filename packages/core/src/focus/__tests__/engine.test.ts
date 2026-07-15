import { beforeEach, describe, expect, it } from "vitest";
import { createFocusEngine, type FocusEngine } from "../engine";
import { FocusTransitionError } from "../session";
import { makeCounterId, resetCounter } from "../fixtures";

function fixedEngine(now: string): FocusEngine {
  return createFocusEngine(makeCounterId("id"), () => new Date(now));
}

describe("FocusEngine", () => {
  beforeEach(() => resetCounter());

  it("starts a running session with a generated id", () => {
    const engine = fixedEngine("2026-07-11T09:00:00Z");
    const s = engine.start({ taskId: "t1", type: "deep_work", plannedMinutes: 50 });
    expect(s.status).toBe("running");
    expect(s.id).toBe("id-1");
    expect(s.startedAt).toBe("2026-07-11T09:00:00.000Z");
  });

  it("rejects starting a meeting as focus is allowed but flagged type", () => {
    const engine = fixedEngine("2026-07-11T09:00:00Z");
    const s = engine.start({ type: "meeting" });
    expect(s.type).toBe("meeting");
  });

  it("pause then resume accumulates paused time", () => {
    let clock = "2026-07-11T09:00:00Z";
    const engine = createFocusEngine(makeCounterId(), () => new Date(clock));
    let s = engine.start({ plannedMinutes: 50 });
    clock = "2026-07-11T09:20:00Z";
    s = engine.pause(s);
    clock = "2026-07-11T09:30:00Z";
    s = engine.resume(s);
    expect(s.pausedDurationMs).toBe(10 * 60_000);
    expect(engine.timer(s).focusMs).toBe(20 * 60_000);
  });

  it("completes a session and records energyAfter", () => {
    const engine = fixedEngine("2026-07-11T10:00:00Z");
    const started = createFocusEngine(
      makeCounterId(),
      () => new Date("2026-07-11T09:00:00Z"),
    ).start({});
    const done = engine.complete(started, 55);
    expect(done.status).toBe("completed");
    expect(done.energyAfter).toBe(55);
  });

  it("begins a break with a recommendation default", () => {
    const engine = createFocusEngine(makeCounterId(), () => new Date("2026-07-11T10:00:00Z"));
    const started = createFocusEngine(
      () => "s",
      () => new Date("2026-07-11T09:00:00Z"),
    ).start({ plannedMinutes: 50 });
    const { session, brk } = engine.beginBreak(started);
    expect(session.status).toBe("break");
    expect(brk.type).toBe("short"); // 60 min focus → short break
  });

  it("adds an interruption with a generated id", () => {
    const engine = fixedEngine("2026-07-11T09:10:00Z");
    const started = engine.start({});
    const { session, interruption } = engine.addInterruption(started, "phone", "call");
    expect(session.interruptions).toHaveLength(1);
    expect(interruption.type).toBe("phone");
    expect(interruption.note).toBe("call");
  });

  it("switchTask re-targets the running session", () => {
    const engine = fixedEngine("2026-07-11T09:00:00Z");
    const started = engine.start({ taskId: "a" });
    const switched = engine.switchTask(started, { taskId: "b" });
    expect(switched.taskId).toBe("b");
  });

  it("cancel and abandon end the session distinctly", () => {
    const engine = fixedEngine("2026-07-11T09:30:00Z");
    const started = engine.start({});
    expect(engine.cancel(started).status).toBe("cancelled");
    expect(engine.abandon(started).status).toBe("abandoned");
  });

  it("throws a transition error on illegal completes", () => {
    const engine = fixedEngine("2026-07-11T09:00:00Z");
    const started = engine.start({});
    const done = engine.complete(started);
    expect(() => engine.complete(done)).toThrow(FocusTransitionError);
  });

  it("computes readiness, recommendations and summary", () => {
    const engine = fixedEngine("2026-07-11T09:30:00Z");
    const started = createFocusEngine(
      () => "s",
      () => new Date("2026-07-11T09:00:00Z"),
    ).start({ plannedMinutes: 50 });
    const readiness = engine.readiness({
      score: 80,
      hydrationPercent: 70,
      recovery: "high",
      sleepMinutes: 450,
    });
    expect(readiness.level).toBe("good");
    const recs = engine.recommendations(started, {
      score: 80,
      hydrationPercent: 70,
      recovery: "high",
      sleepMinutes: 450,
    });
    expect(recs.length).toBeGreaterThan(0);
    const summary = engine.summary(started, [started]);
    expect(summary.active).toBe(true);
  });

  it("signals surface planner drift through the engine", () => {
    const engine = fixedEngine("2026-07-11T09:30:00Z");
    const started = engine.start({ plannerBlockId: null });
    const sig = engine.signals({
      active: started,
      todaysSessions: [started],
      plannerBlocksPending: true,
    });
    expect(sig.plannerDrift).toBe(true);
  });
});
