import { describe, expect, it } from "vitest";
import {
  FocusTransitionError,
  abandonSession,
  addInterruption,
  beginBreak,
  cancelSession,
  canFocus,
  completeSession,
  createSession,
  pauseSession,
  resumeSession,
  setNotes,
  startSession,
  switchTask,
} from "../session";
import { makeBreakFixture, makeInterruptionFixture, makeSession } from "../fixtures";

const MIN = 60_000;
const t0 = new Date("2026-07-11T09:00:00Z");

describe("session lifecycle", () => {
  it("creates an idle draft with defaults", () => {
    const s = createSession({}, { id: "s1", now: t0 });
    expect(s.status).toBe("idle");
    expect(s.type).toBe("focus");
    expect(s.plannedMinutes).toBe(50);
    expect(s.startedAt).toBeNull();
    expect(s.completed).toBe(false);
  });

  it("carries through references and energyBefore", () => {
    const s = createSession(
      { taskId: "t", projectId: "p", plannerBlockId: "b", energyBefore: 80, type: "deep_work" },
      { id: "s1", now: t0 },
    );
    expect(s.taskId).toBe("t");
    expect(s.projectId).toBe("p");
    expect(s.plannerBlockId).toBe("b");
    expect(s.energyBefore).toBe(80);
    expect(s.type).toBe("deep_work");
  });

  it("enforces minimum planned minutes of 1", () => {
    const s = createSession({ plannedMinutes: 0 }, { id: "s1", now: t0 });
    expect(s.plannedMinutes).toBe(1);
  });

  it("starts a session and stamps startedAt", () => {
    const s = startSession(createSession({}, { id: "s1", now: t0 }), t0);
    expect(s.status).toBe("running");
    expect(s.startedAt).toBe(t0.toISOString());
  });

  it("throws when starting a non-idle session", () => {
    const s = makeSession({ status: "running" });
    expect(() => startSession(s, t0)).toThrow(FocusTransitionError);
  });

  it("pauses a running session", () => {
    const s = pauseSession(makeSession({ status: "running" }), t0);
    expect(s.status).toBe("paused");
    expect(s.pausedAt).toBe(t0.toISOString());
  });

  it("throws when pausing a non-running session", () => {
    expect(() => pauseSession(makeSession({ status: "paused" }), t0)).toThrow();
  });

  it("resume folds the live pause into accumulated total", () => {
    const s = makeSession({
      status: "paused",
      pausedAt: "2026-07-11T09:00:00Z",
      pausedDurationMs: 2 * MIN,
    });
    const r = resumeSession(s, new Date("2026-07-11T09:05:00Z"));
    expect(r.status).toBe("running");
    expect(r.pausedAt).toBeNull();
    expect(r.pausedDurationMs).toBe(7 * MIN);
  });

  it("resume closes an active break", () => {
    const openBreak = makeBreakFixture({ endedAt: null });
    const s = makeSession({
      status: "break",
      pausedAt: "2026-07-11T09:00:00Z",
      breaks: [openBreak],
    });
    const r = resumeSession(s, new Date("2026-07-11T09:10:00Z"));
    expect(r.breaks[0]?.endedAt).toBe("2026-07-11T09:10:00.000Z");
  });

  it("completes a running session and stamps energyAfter", () => {
    const s = completeSession(makeSession({ status: "running" }), t0, 60);
    expect(s.status).toBe("completed");
    expect(s.completed).toBe(true);
    expect(s.endedAt).toBe(t0.toISOString());
    expect(s.energyAfter).toBe(60);
  });

  it("completing from paused settles the live pause first", () => {
    const s = makeSession({
      status: "paused",
      startedAt: "2026-07-11T09:00:00Z",
      pausedAt: "2026-07-11T09:20:00Z",
    });
    const done = completeSession(s, new Date("2026-07-11T09:30:00Z"));
    expect(done.status).toBe("completed");
    expect(done.pausedDurationMs).toBe(10 * MIN);
  });

  it("throws when completing an already-terminal session", () => {
    expect(() => completeSession(makeSession({ status: "completed" }), t0)).toThrow();
  });

  it("cancel marks not-completed", () => {
    const s = cancelSession(makeSession({ status: "running" }), t0);
    expect(s.status).toBe("cancelled");
    expect(s.completed).toBe(false);
    expect(s.endedAt).toBe(t0.toISOString());
  });

  it("abandon keeps not-completed but ends the session", () => {
    const s = abandonSession(makeSession({ status: "running" }), t0);
    expect(s.status).toBe("abandoned");
    expect(s.completed).toBe(false);
  });

  it("begins a break and attaches a record", () => {
    const s = beginBreak(
      makeSession({ status: "running" }),
      makeBreakFixture({ endedAt: null }),
      t0,
    );
    expect(s.status).toBe("break");
    expect(s.pausedAt).toBe(t0.toISOString());
    expect(s.breaks).toHaveLength(1);
  });

  it("switchTask re-targets a running session without restarting", () => {
    const s = switchTask(
      makeSession({ status: "running" }),
      { taskId: "new", projectId: "np" },
      t0,
    );
    expect(s.taskId).toBe("new");
    expect(s.projectId).toBe("np");
    expect(s.status).toBe("running");
    expect(s.startedAt).toBe("2026-07-11T09:00:00.000Z");
  });

  it("switchTask throws on a terminal session", () => {
    expect(() => switchTask(makeSession({ status: "completed" }), { taskId: "x" }, t0)).toThrow();
  });

  it("addInterruption appends and rejects terminal sessions", () => {
    const s = addInterruption(makeSession({ status: "running" }), makeInterruptionFixture(), t0);
    expect(s.interruptions).toHaveLength(1);
    expect(() =>
      addInterruption(makeSession({ status: "cancelled" }), makeInterruptionFixture(), t0),
    ).toThrow();
  });

  it("setNotes replaces notes", () => {
    const s = setNotes(makeSession(), "wrote the spec", t0);
    expect(s.notes).toBe("wrote the spec");
  });

  it("canFocus rejects meetings only", () => {
    expect(canFocus("deep_work")).toBe(true);
    expect(canFocus("meeting")).toBe(false);
  });
});
