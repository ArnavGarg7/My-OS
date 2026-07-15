import { describe, expect, it } from "vitest";
import { CalendarEngine, calendarEngine } from "./engine";
import { DATE, at, iso, makeEvent, makeWindow } from "./fixtures";

const engine = new CalendarEngine();
const RANGE_START = at(0).toISOString();
const RANGE_END = new Date(at(0).getTime() + 7 * 86_400_000).toISOString();

describe("mergeCalendars", () => {
  it("dedupes by id and sorts", () => {
    const merged = engine.mergeCalendars([
      [makeEvent({ id: "b", startAt: iso(12), endAt: iso(13) })],
      [
        makeEvent({ id: "a", startAt: iso(9), endAt: iso(10) }),
        makeEvent({ id: "b", startAt: iso(12), endAt: iso(13) }),
      ],
    ]);
    expect(merged.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("expand", () => {
  it("expands recurrence across events", () => {
    const events = [
      makeEvent({ id: "r", recurrenceRule: { frequency: "daily", interval: 1, count: 3 } }),
    ];
    expect(engine.expand(events, RANGE_START, RANGE_END)).toHaveLength(3);
  });
});

describe("availability + freeBusy", () => {
  it("derives intervals and free/busy from events", () => {
    const intervals = engine.availability({
      date: DATE,
      windows: [makeWindow()],
      events: [makeEvent({ startAt: iso(10), endAt: iso(11) })],
    });
    const fb = engine.freeBusy(intervals, at(9));
    expect(fb.meetingMinutes).toBe(60);
    expect(fb.freeMinutes).toBeGreaterThan(0);
  });
});

describe("conflicts", () => {
  it("detects overlaps", () => {
    const conflicts = engine.conflicts({
      events: [
        makeEvent({ id: "a", startAt: iso(9), endAt: iso(11) }),
        makeEvent({ id: "b", startAt: iso(10), endAt: iso(12) }),
      ],
    });
    expect(conflicts.length).toBeGreaterThan(0);
  });
});

describe("summary", () => {
  it("assembles meeting count, next event and free/busy", () => {
    const summary = engine.summary({
      date: DATE,
      windows: [makeWindow()],
      events: [
        makeEvent({ id: "a", title: "Standup", startAt: iso(10), endAt: iso(10, 30) }),
        makeEvent({ id: "b", title: "Review", startAt: iso(15), endAt: iso(16) }),
      ],
      now: at(9),
    });
    expect(summary.meetingCount).toBe(2);
    expect(summary.nextEvent?.id).toBe("a");
    expect(summary.freeBusy.busyMinutes).toBeGreaterThan(0);
  });

  it("reports the current event during a meeting", () => {
    const summary = engine.summary({
      date: DATE,
      windows: [makeWindow()],
      events: [makeEvent({ id: "a", startAt: iso(10), endAt: iso(11) })],
      now: at(10, 30),
    });
    expect(summary.currentEvent?.id).toBe("a");
  });
});

describe("expand ignores non-recurring outside range", () => {
  it("drops events entirely outside the window", () => {
    const events = [
      makeEvent({ startAt: "2020-01-01T09:00:00.000Z", endAt: "2020-01-01T10:00:00.000Z" }),
    ];
    expect(engine.expand(events, RANGE_START, RANGE_END)).toHaveLength(0);
  });
});

describe("singleton", () => {
  it("exposes a shared engine", () => {
    expect(calendarEngine).toBeInstanceOf(CalendarEngine);
  });
});
