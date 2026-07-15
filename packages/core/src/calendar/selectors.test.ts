import { describe, expect, it } from "vitest";
import {
  currentEvent,
  eventsByCalendar,
  eventsOnDay,
  firstMeeting,
  meetingCount,
  nextEvent,
  sortEvents,
  visibleEvents,
} from "./selectors";
import { DATE, iso, makeCalendar, makeEvent } from "./fixtures";

const events = [
  makeEvent({ id: "c", title: "Late", startAt: iso(15), endAt: iso(16) }),
  makeEvent({ id: "a", title: "Early", startAt: iso(9), endAt: iso(10) }),
  makeEvent({ id: "b", title: "Mid", startAt: iso(12), endAt: iso(13) }),
];

describe("sortEvents", () => {
  it("orders chronologically", () => {
    expect(sortEvents(events).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });
});

describe("eventsOnDay", () => {
  it("filters to the given day", () => {
    const other = makeEvent({
      id: "x",
      startAt: "2026-07-09T09:00:00.000Z",
      endAt: "2026-07-09T10:00:00.000Z",
    });
    expect(eventsOnDay([...events, other], DATE, "UTC").map((e) => e.id)).toEqual(["a", "b", "c"]);
  });
});

describe("currentEvent / nextEvent", () => {
  it("returns the event happening now", () => {
    expect(currentEvent(events, new Date(iso(12, 30)))?.id).toBe("b");
  });
  it("returns the next upcoming event", () => {
    expect(nextEvent(events, new Date(iso(10, 30)))?.id).toBe("b");
  });
  it("returns null when nothing is current", () => {
    expect(currentEvent(events, new Date(iso(11)))).toBeNull();
  });
});

describe("firstMeeting / meetingCount", () => {
  it("returns the first timed meeting", () => {
    expect(firstMeeting(events)?.id).toBe("a");
  });
  it("counts timed meetings", () => {
    const withAllDay = [...events, makeEvent({ id: "d", allDay: true })];
    expect(meetingCount(withAllDay)).toBe(3);
  });
});

describe("visibleEvents", () => {
  it("hides events from invisible calendars", () => {
    const cals = [makeCalendar({ id: "cal1", visible: false })];
    expect(visibleEvents(events, cals)).toEqual([]);
  });
  it("keeps events from visible calendars", () => {
    const cals = [makeCalendar({ id: "cal1", visible: true })];
    expect(visibleEvents(events, cals)).toHaveLength(3);
  });
});

describe("eventsByCalendar", () => {
  it("groups events by calendar id", () => {
    const grouped = eventsByCalendar(events);
    expect(grouped.get("cal1")).toHaveLength(3);
  });
  it("separates events across calendars", () => {
    const mixed = [
      makeEvent({ id: "a", calendarId: "work" }),
      makeEvent({ id: "b", calendarId: "home" }),
    ];
    const grouped = eventsByCalendar(mixed);
    expect(grouped.get("work")).toHaveLength(1);
    expect(grouped.get("home")).toHaveLength(1);
  });
});

describe("nextEvent skips cancelled", () => {
  it("ignores cancelled events when finding the next one", () => {
    const evs = [
      makeEvent({ id: "c1", startAt: iso(11), endAt: iso(12), status: "cancelled" }),
      makeEvent({ id: "c2", startAt: iso(13), endAt: iso(14) }),
    ];
    expect(nextEvent(evs, new Date(iso(10)))?.id).toBe("c2");
  });
});
