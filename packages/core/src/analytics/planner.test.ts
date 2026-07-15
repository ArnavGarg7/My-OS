import { describe, expect, it } from "vitest";
import { computeCalendar, computePlanner } from "./planner";
import { at, ev } from "./fixtures";

describe("computePlanner", () => {
  it("derives completion rate + passes through snapshot", () => {
    const m = computePlanner({
      accuracy: 82,
      blocksCompleted: 8,
      blocksTotal: 10,
      regenerations: 2,
      lockedBlocks: 3,
      overflow: 1,
      utilization: 75,
    });
    expect(m.accuracy).toBe(82);
    expect(m.completionRate).toBe(80);
    expect(m.regenerations).toBe(2);
    expect(m.utilization).toBe(75);
  });
  it("defaults to zeros without input", () => {
    const m = computePlanner();
    expect(m.accuracy).toBe(0);
    expect(m.completionRate).toBe(0);
  });
});

describe("computeCalendar", () => {
  it("computes meeting/focus/free hours + ratios", () => {
    const events = [
      ev({
        eventType: "calendar.meeting_finished",
        source: "calendar",
        timestamp: at(2026, 6, 6, 10),
        metadata: { durationMinutes: 60 },
      }),
      ev({
        eventType: "task.completed",
        timestamp: at(2026, 6, 6, 12),
        metadata: { focusMinutes: 120 },
      }),
    ];
    const c = computeCalendar(events, 120);
    expect(c.meetingHours).toBe(1);
    expect(c.focusHours).toBe(2);
    expect(c.meetingRatio).toBeGreaterThan(0);
    expect(c.longestUninterruptedMinutes).toBe(120);
    expect(c.freeHours).toBeGreaterThanOrEqual(0);
  });
  it("uses a default meeting length when unset", () => {
    const events = [
      ev({
        eventType: "calendar.meeting_finished",
        source: "calendar",
        timestamp: at(2026, 6, 6, 10),
      }),
    ];
    const c = computeCalendar(events, 0);
    expect(c.meetingHours).toBe(0.5);
  });
  it("has no meeting hours when there are no meetings", () => {
    const c = computeCalendar([ev({ metadata: { focusMinutes: 60 } })], 60);
    expect(c.meetingHours).toBe(0);
    expect(c.focusHours).toBe(1);
  });
});
