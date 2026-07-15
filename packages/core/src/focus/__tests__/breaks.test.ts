import { describe, expect, it } from "vitest";
import { breakMinutes, makeBreak, recommendBreak, recoveredMinutes } from "../breaks";
import { makeBreakFixture, makeInterruptionFixture, makeSession } from "../fixtures";

const start = "2026-07-11T09:00:00Z";

describe("break rules", () => {
  it("recommends a recovery break after 90 minutes", () => {
    const s = makeSession({ startedAt: start });
    const r = recommendBreak(s, new Date("2026-07-11T10:30:00Z"));
    expect(r.recommend).toBe(true);
    expect(r.type).toBe("recovery");
    expect(r.minutes).toBe(20);
  });

  it("recommends a short break after 50 minutes", () => {
    const s = makeSession({ startedAt: start });
    const r = recommendBreak(s, new Date("2026-07-11T09:55:00Z"));
    expect(r.recommend).toBe(true);
    expect(r.type).toBe("short");
    expect(r.minutes).toBe(10);
  });

  it("recommends a reset break after 4 interruptions before 50 min", () => {
    const s = makeSession({
      startedAt: start,
      interruptions: [1, 2, 3, 4].map((n) => makeInterruptionFixture({ id: `i${n}` })),
    });
    const r = recommendBreak(s, new Date("2026-07-11T09:20:00Z"));
    expect(r.recommend).toBe(true);
    expect(r.type).toBe("short");
    expect(r.reason).toContain("interruptions");
  });

  it("recommends a recovery break when readiness is low", () => {
    const s = makeSession({ startedAt: start });
    const r = recommendBreak(s, new Date("2026-07-11T09:10:00Z"), 40);
    expect(r.recommend).toBe(true);
    expect(r.type).toBe("recovery");
  });

  it("does not recommend a break early with good readiness", () => {
    const s = makeSession({ startedAt: start });
    const r = recommendBreak(s, new Date("2026-07-11T09:10:00Z"), 90);
    expect(r.recommend).toBe(false);
  });

  it("90-min rule wins over low readiness ordering", () => {
    const s = makeSession({ startedAt: start });
    const r = recommendBreak(s, new Date("2026-07-11T10:35:00Z"), 30);
    expect(r.type).toBe("recovery");
    expect(r.reason).toContain("straight");
  });

  it("makeBreak builds an open record with min 1 minute", () => {
    const b = makeBreak("b1", new Date(start), "hydration", 0);
    expect(b.endedAt).toBeNull();
    expect(b.plannedMinutes).toBe(1);
    expect(b.type).toBe("hydration");
  });

  it("breakMinutes sums completed breaks only", () => {
    const s = makeSession({
      breaks: [
        makeBreakFixture({ startedAt: "2026-07-11T09:00:00Z", endedAt: "2026-07-11T09:10:00Z" }),
        makeBreakFixture({ id: "b2", startedAt: "2026-07-11T09:20:00Z", endedAt: null }),
      ],
    });
    expect(breakMinutes(s)).toBe(10);
  });

  it("recoveredMinutes counts only recovery/hydration/walk", () => {
    const s = makeSession({
      breaks: [
        makeBreakFixture({ type: "short", endedAt: "2026-07-11T10:00:00Z" }),
        makeBreakFixture({
          id: "b2",
          type: "walk",
          startedAt: "2026-07-11T10:00:00Z",
          endedAt: "2026-07-11T10:15:00Z",
        }),
      ],
    });
    expect(recoveredMinutes(s)).toBe(15);
  });
});
