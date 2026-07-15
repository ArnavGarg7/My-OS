import { describe, expect, it } from "vitest";
import { computeAvailability } from "./availability";
import { DATE, iso, makeEvent, makeWindow } from "./fixtures";

describe("computeAvailability", () => {
  it("classifies a working day with a meeting", () => {
    const intervals = computeAvailability({
      date: DATE,
      windows: [makeWindow({ startTime: "09:00", endTime: "18:00", type: "working" })],
      events: [makeEvent({ startAt: iso(10), endAt: iso(11), title: "Standup" })],
    });
    const meeting = intervals.find((i) => i.type === "meeting");
    expect(meeting).toBeDefined();
    expect(new Date(meeting!.start).getHours()).toBe(10);
    expect(intervals.some((i) => i.type === "available")).toBe(true);
  });

  it("marks time outside working hours as personal", () => {
    const intervals = computeAvailability({
      date: DATE,
      windows: [makeWindow({ startTime: "09:00", endTime: "18:00" })],
      events: [],
    });
    const early = intervals.find((i) => new Date(i.start).getHours() === 0);
    expect(early?.type).toBe("personal");
  });

  it("produces a gap-free timeline covering the day", () => {
    const intervals = computeAvailability({
      date: DATE,
      windows: [makeWindow()],
      events: [makeEvent({ startAt: iso(10), endAt: iso(11) })],
    });
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]!.start).toBe(intervals[i - 1]!.end);
    }
  });

  it("honors focus windows via availability type", () => {
    const intervals = computeAvailability({
      date: DATE,
      windows: [
        makeWindow({ id: "w1", startTime: "09:00", endTime: "18:00", type: "working" }),
        makeWindow({ id: "w2", startTime: "10:00", endTime: "12:00", type: "focus" }),
      ],
      events: [],
    });
    expect(intervals.some((i) => i.type === "focus")).toBe(true);
  });

  it("lets a meeting take precedence over a focus window", () => {
    const intervals = computeAvailability({
      date: DATE,
      windows: [
        makeWindow({ id: "w1", startTime: "09:00", endTime: "18:00", type: "working" }),
        makeWindow({ id: "w2", startTime: "10:00", endTime: "12:00", type: "focus" }),
      ],
      events: [makeEvent({ startAt: iso(10, 30), endAt: iso(11) })],
    });
    const at1030 = intervals.find(
      (i) => new Date(i.start).getHours() === 10 && new Date(i.start).getMinutes() === 30,
    );
    expect(at1030?.type).toBe("meeting");
  });

  it("ignores windows for other weekdays", () => {
    const intervals = computeAvailability({
      date: DATE, // Tuesday (2)
      windows: [makeWindow({ weekday: 3, startTime: "09:00", endTime: "18:00" })],
      events: [],
    });
    // no working window on Tuesday → all personal
    expect(intervals.every((i) => i.type === "personal")).toBe(true);
  });

  it("merges adjacent same-type intervals", () => {
    const intervals = computeAvailability({
      date: DATE,
      windows: [makeWindow({ startTime: "09:00", endTime: "18:00" })],
      events: [],
    });
    // personal · available · personal → 3 segments
    expect(intervals).toHaveLength(3);
  });

  it("labels each interval", () => {
    const intervals = computeAvailability({ date: DATE, windows: [makeWindow()], events: [] });
    expect(intervals.every((i) => i.label.length > 0)).toBe(true);
  });

  it("attaches the event id to meeting intervals", () => {
    const intervals = computeAvailability({
      date: DATE,
      windows: [makeWindow()],
      events: [makeEvent({ id: "evt", startAt: iso(10), endAt: iso(11) })],
    });
    expect(intervals.find((i) => i.type === "meeting")?.eventId).toBe("evt");
  });

  it("handles a fully-empty day as all personal", () => {
    const intervals = computeAvailability({ date: DATE, windows: [], events: [] });
    expect(intervals).toHaveLength(1);
    expect(intervals[0]!.type).toBe("personal");
  });
});
