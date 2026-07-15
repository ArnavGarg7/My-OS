import { describe, expect, it } from "vitest";
import { computeSignals } from "../signals";
import { completedSession, makeInterruptionFixture, makeSession } from "../fixtures";

const NOW = new Date("2026-07-11T12:00:00Z");

describe("focus signals", () => {
  it("reports idle when no active session", () => {
    const s = computeSignals({
      active: null,
      todaysSessions: [],
      plannerBlocksPending: false,
      now: NOW,
    });
    expect(s.active).toBe(false);
    expect(s.status).toBe("idle");
    expect(s.tooManyInterruptions).toBe(false);
  });

  it("flags too many interruptions", () => {
    const active = makeSession({
      status: "running",
      interruptions: [1, 2, 3, 4].map((n) => makeInterruptionFixture({ id: `i${n}` })),
    });
    const s = computeSignals({
      active,
      todaysSessions: [active],
      plannerBlocksPending: false,
      now: NOW,
    });
    expect(s.tooManyInterruptions).toBe(true);
  });

  it("flags long unfinished when overrunning an incomplete work session", () => {
    const active = makeSession({
      status: "running",
      startedAt: "2026-07-11T09:00:00Z",
      plannedMinutes: 50,
      completed: false,
    });
    const s = computeSignals({
      active,
      todaysSessions: [active],
      plannerBlocksPending: false,
      now: NOW,
    });
    expect(s.longUnfinished).toBe(true);
  });

  it("does not flag long unfinished within the plan", () => {
    const active = makeSession({
      status: "running",
      startedAt: "2026-07-11T11:45:00Z",
      plannedMinutes: 50,
    });
    const s = computeSignals({
      active,
      todaysSessions: [active],
      plannerBlocksPending: false,
      now: NOW,
    });
    expect(s.longUnfinished).toBe(false);
  });

  it("flags planner drift for unplanned work while blocks await", () => {
    const active = makeSession({ status: "running", plannerBlockId: null });
    const s = computeSignals({
      active,
      todaysSessions: [active],
      plannerBlocksPending: true,
      now: NOW,
    });
    expect(s.plannerDrift).toBe(true);
  });

  it("no planner drift when session is tied to a block", () => {
    const active = makeSession({ status: "running", plannerBlockId: "blk" });
    const s = computeSignals({
      active,
      todaysSessions: [active],
      plannerBlocksPending: true,
      now: NOW,
    });
    expect(s.plannerDrift).toBe(false);
  });

  it("aggregates today's focus minutes", () => {
    const s = computeSignals({
      active: null,
      todaysSessions: [completedSession("a", "deep_work", 50), completedSession("b", "focus", 25)],
      plannerBlocksPending: false,
      now: NOW,
    });
    expect(s.focusMinutesToday).toBe(75);
  });
});
