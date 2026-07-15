import { describe, expect, it } from "vitest";
import { computeTimer, focusMinutesAt, focusMsAt, isOverrunning, pausedMsAt } from "../timer";
import { makeSession, makeBreakFixture } from "../fixtures";

const MIN = 60_000;

describe("focus timer", () => {
  it("returns planned remaining and zero focus for an idle session", () => {
    const s = makeSession({ status: "idle", startedAt: null, plannedMinutes: 50 });
    const t = computeTimer(s, new Date("2026-07-11T10:00:00Z"));
    expect(t.focusMs).toBe(0);
    expect(t.remainingMs).toBe(50 * MIN);
    expect(t.progress).toBe(0);
    expect(t.estimatedFinish).toBeNull();
  });

  it("computes elapsed and focus for a running session", () => {
    const s = makeSession({ startedAt: "2026-07-11T09:00:00Z", plannedMinutes: 50 });
    const t = computeTimer(s, new Date("2026-07-11T09:30:00Z"));
    expect(t.elapsedMs).toBe(30 * MIN);
    expect(t.focusMs).toBe(30 * MIN);
    expect(t.remainingMs).toBe(20 * MIN);
    expect(t.progress).toBe(60);
  });

  it("excludes accumulated paused time from focus", () => {
    const s = makeSession({
      startedAt: "2026-07-11T09:00:00Z",
      pausedDurationMs: 10 * MIN,
      plannedMinutes: 50,
    });
    const t = computeTimer(s, new Date("2026-07-11T09:30:00Z"));
    expect(t.pausedMs).toBe(10 * MIN);
    expect(t.focusMs).toBe(20 * MIN);
  });

  it("includes the live pause when currently paused", () => {
    const s = makeSession({
      status: "paused",
      startedAt: "2026-07-11T09:00:00Z",
      pausedAt: "2026-07-11T09:20:00Z",
      plannedMinutes: 50,
    });
    // now is 10 min after pause began; focus should freeze at 20 min.
    const t = computeTimer(s, new Date("2026-07-11T09:30:00Z"));
    expect(t.pausedMs).toBe(10 * MIN);
    expect(t.focusMs).toBe(20 * MIN);
  });

  it("pausedMsAt sums stored plus live pause", () => {
    const s = makeSession({
      status: "paused",
      pausedDurationMs: 5 * MIN,
      pausedAt: "2026-07-11T09:00:00Z",
    });
    expect(pausedMsAt(s, new Date("2026-07-11T09:03:00Z"))).toBe(8 * MIN);
  });

  it("clamps remaining at zero and reports overrun", () => {
    const s = makeSession({ startedAt: "2026-07-11T09:00:00Z", plannedMinutes: 50 });
    const t = computeTimer(s, new Date("2026-07-11T10:10:00Z")); // 70 min focus
    expect(t.remainingMs).toBe(0);
    expect(t.overrunMs).toBe(20 * MIN);
    expect(t.progress).toBe(100);
  });

  it("isOverrunning respects the 15-minute threshold", () => {
    const s = makeSession({ startedAt: "2026-07-11T09:00:00Z", plannedMinutes: 50 });
    expect(isOverrunning(s, new Date("2026-07-11T10:00:00Z"))).toBe(false); // exactly planned
    expect(isOverrunning(s, new Date("2026-07-11T10:16:00Z"))).toBe(true); // +16
  });

  it("focusMinutesAt floors to whole minutes", () => {
    const s = makeSession({ startedAt: "2026-07-11T09:00:00Z" });
    expect(focusMinutesAt(s, new Date("2026-07-11T09:30:30Z"))).toBe(30);
  });

  it("stops the clock at endedAt for a completed session", () => {
    const s = makeSession({
      status: "completed",
      startedAt: "2026-07-11T09:00:00Z",
      endedAt: "2026-07-11T09:45:00Z",
    });
    expect(focusMsAt(s, new Date("2026-07-11T11:00:00Z"))).toBe(45 * MIN);
  });

  it("estimated finish is now + remaining while running", () => {
    const s = makeSession({ startedAt: "2026-07-11T09:00:00Z", plannedMinutes: 50 });
    const now = new Date("2026-07-11T09:30:00Z");
    const t = computeTimer(s, now);
    expect(t.estimatedFinish).toBe("2026-07-11T09:50:00.000Z");
  });

  it("progress is 100 for a zero-minute plan", () => {
    const s = makeSession({ startedAt: "2026-07-11T09:00:00Z", plannedMinutes: 0 });
    const t = computeTimer(s, new Date("2026-07-11T09:05:00Z"));
    expect(t.progress).toBe(100);
  });

  it("break time is treated like pause via breaks not affecting stored pause", () => {
    const s = makeSession({
      startedAt: "2026-07-11T09:00:00Z",
      breaks: [makeBreakFixture()],
    });
    // breaks array alone doesn't reduce focus — pausedDurationMs does.
    const t = computeTimer(s, new Date("2026-07-11T09:30:00Z"));
    expect(t.focusMs).toBe(30 * MIN);
  });
});
