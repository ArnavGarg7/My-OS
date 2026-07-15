import { describe, expect, it } from "vitest";
import { computeMetrics, totalDeepWorkMinutes, totalFocusMinutes } from "../metrics";
import {
  completedSession,
  makeBreakFixture,
  makeInterruptionFixture,
  makeSession,
} from "../fixtures";

const NOW = new Date("2026-07-11T12:00:00Z");

describe("focus metrics", () => {
  it("returns an empty metric set for no sessions", () => {
    const m = computeMetrics([], NOW);
    expect(m.totalSessions).toBe(0);
    expect(m.focusPercent).toBe(0);
    expect(m.completionRate).toBe(0);
  });

  it("splits deep vs shallow minutes by type", () => {
    const m = computeMetrics(
      [completedSession("a", "deep_work", 50), completedSession("b", "shallow_work", 30)],
      NOW,
    );
    expect(m.deepWorkMinutes).toBe(50);
    expect(m.shallowMinutes).toBe(30);
  });

  it("computes longest and average session minutes over work sessions", () => {
    const m = computeMetrics(
      [completedSession("a", "deep_work", 60), completedSession("b", "focus", 20)],
      NOW,
    );
    expect(m.longestSessionMinutes).toBe(60);
    expect(m.averageSessionMinutes).toBe(40);
  });

  it("counts interruptions across sessions", () => {
    const m = computeMetrics(
      [
        completedSession("a", "deep_work", 50, {
          interruptions: [makeInterruptionFixture(), makeInterruptionFixture({ id: "i2" })],
        }),
      ],
      NOW,
    );
    expect(m.interruptions).toBe(2);
  });

  it("computes completion rate as a percentage", () => {
    const m = computeMetrics(
      [
        completedSession("a", "deep_work", 50),
        makeSession({ id: "b", type: "focus", status: "abandoned", completed: false }),
      ],
      NOW,
    );
    expect(m.completionRate).toBe(50);
  });

  it("planner accuracy only counts planner-linked sessions", () => {
    const m = computeMetrics(
      [
        completedSession("a", "deep_work", 50, { plannerBlockId: "blk" }),
        completedSession("b", "deep_work", 50, {
          plannerBlockId: "blk2",
          completed: false,
          status: "abandoned",
        }),
        completedSession("c", "deep_work", 50, { plannerBlockId: null }),
      ],
      NOW,
    );
    expect(m.plannerAccuracy).toBe(50);
  });

  it("focus percent excludes break time from the work numerator", () => {
    const m = computeMetrics(
      [
        completedSession("a", "deep_work", 50, {
          breaks: [
            makeBreakFixture({
              startedAt: "2026-07-11T09:00:00Z",
              endedAt: "2026-07-11T09:10:00Z",
            }),
          ],
        }),
      ],
      NOW,
    );
    // 50 work / (50 + 10 break) = 83.3%
    expect(m.focusPercent).toBeCloseTo(83.3, 1);
    expect(m.breakMinutes).toBe(10);
  });

  it("recovered minutes tallies recovery breaks", () => {
    const m = computeMetrics(
      [
        completedSession("a", "deep_work", 50, {
          breaks: [
            makeBreakFixture({
              type: "recovery",
              startedAt: "2026-07-11T09:00:00Z",
              endedAt: "2026-07-11T09:20:00Z",
            }),
          ],
        }),
      ],
      NOW,
    );
    expect(m.recoveredMinutes).toBe(20);
  });

  it("meeting sessions do not count as work minutes", () => {
    const m = computeMetrics([completedSession("m", "meeting", 30)], NOW);
    expect(m.deepWorkMinutes).toBe(0);
    expect(m.shallowMinutes).toBe(0);
    expect(m.longestSessionMinutes).toBe(0);
  });

  it("totalFocusMinutes and totalDeepWorkMinutes aggregate correctly", () => {
    const sessions = [
      completedSession("a", "deep_work", 50),
      completedSession("b", "shallow_work", 25),
    ];
    expect(totalFocusMinutes(sessions, NOW)).toBe(75);
    expect(totalDeepWorkMinutes(sessions, NOW)).toBe(50);
  });
});
