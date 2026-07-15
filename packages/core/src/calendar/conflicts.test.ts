import { describe, expect, it } from "vitest";
import { detectConflicts } from "./conflicts";
import { iso, makeEvent } from "./fixtures";

describe("detectConflicts", () => {
  it("reports no conflicts for a clean schedule", () => {
    const events = [
      makeEvent({ id: "a", startAt: iso(9), endAt: iso(10) }),
      makeEvent({ id: "b", startAt: iso(10), endAt: iso(11) }),
    ];
    expect(detectConflicts({ events })).toEqual([]);
  });

  it("detects a double-booking of two confirmed events", () => {
    const events = [
      makeEvent({ id: "a", startAt: iso(9), endAt: iso(10, 30), status: "confirmed" }),
      makeEvent({ id: "b", startAt: iso(10), endAt: iso(11), status: "confirmed" }),
    ];
    expect(detectConflicts({ events }).some((c) => c.type === "double-booking")).toBe(true);
  });

  it("reports a plain overlap when one event is tentative", () => {
    const events = [
      makeEvent({ id: "a", startAt: iso(9), endAt: iso(10, 30), status: "confirmed" }),
      makeEvent({ id: "b", startAt: iso(10), endAt: iso(11), status: "tentative" }),
    ];
    const conflicts = detectConflicts({ events });
    expect(conflicts.some((c) => c.type === "overlap")).toBe(true);
    expect(conflicts.some((c) => c.type === "double-booking")).toBe(false);
  });

  it("ignores cancelled events", () => {
    const events = [
      makeEvent({ id: "a", startAt: iso(9), endAt: iso(10, 30) }),
      makeEvent({ id: "b", startAt: iso(10), endAt: iso(11), status: "cancelled" }),
    ];
    expect(detectConflicts({ events })).toEqual([]);
  });

  it("detects a timezone mismatch on overlapping events", () => {
    const events = [
      makeEvent({ id: "a", startAt: iso(9), endAt: iso(10, 30), timezone: "UTC" }),
      makeEvent({ id: "b", startAt: iso(10), endAt: iso(11), timezone: "America/New_York" }),
    ];
    expect(detectConflicts({ events }).some((c) => c.type === "timezone-mismatch")).toBe(true);
  });

  it("flags events outside working hours", () => {
    const events = [makeEvent({ id: "a", startAt: iso(7), endAt: iso(8) })];
    const conflicts = detectConflicts({ events, workingStart: "09:00", workingEnd: "18:00" });
    expect(conflicts.some((c) => c.type === "outside-working-hours")).toBe(true);
  });

  it("detects planner-block collisions", () => {
    const events = [makeEvent({ id: "a", startAt: iso(10), endAt: iso(11) })];
    const plannerBlocks = [
      {
        id: "blk",
        startTime: iso(10, 30),
        endTime: iso(11, 30),
        locked: false,
        title: "Deep work",
      },
    ];
    expect(
      detectConflicts({ events, plannerBlocks }).some((c) => c.type === "planner-collision"),
    ).toBe(true);
  });

  it("detects an impossible event (end before start)", () => {
    const events = [makeEvent({ id: "a", startAt: iso(10), endAt: iso(9) })];
    expect(detectConflicts({ events }).some((c) => c.type === "impossible-recurrence")).toBe(true);
  });

  it("accumulates several conflicts at once", () => {
    const events = [
      makeEvent({ id: "a", startAt: iso(7), endAt: iso(8, 30) }),
      makeEvent({ id: "b", startAt: iso(8), endAt: iso(9) }),
    ];
    const conflicts = detectConflicts({ events, workingStart: "09:00", workingEnd: "18:00" });
    expect(conflicts.length).toBeGreaterThanOrEqual(2);
  });

  it("returns eventIds on each conflict", () => {
    const events = [
      makeEvent({ id: "a", startAt: iso(9), endAt: iso(11) }),
      makeEvent({ id: "b", startAt: iso(10), endAt: iso(12) }),
    ];
    const c = detectConflicts({ events }).find((x) => x.type === "double-booking")!;
    expect(c.eventIds.sort()).toEqual(["a", "b"]);
  });
});
