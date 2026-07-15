import { describe, expect, it } from "vitest";
import { importIcs, parseIcsDate, parseRrule } from "./importer";

const SAMPLE = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:evt-1@example.com
SUMMARY:Team Standup
DTSTART:20260707T090000Z
DTEND:20260707T093000Z
LOCATION:Zoom
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:evt-2@example.com
SUMMARY:Weekly Sync
DTSTART:20260708T140000Z
DTEND:20260708T150000Z
RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=WE
END:VEVENT
END:VCALENDAR`;

describe("parseIcsDate", () => {
  it("parses a UTC datetime", () => {
    expect(parseIcsDate("20260707T090000Z").iso).toBe("2026-07-07T09:00:00.000Z");
  });
  it("parses a date-only value as all-day", () => {
    const r = parseIcsDate("20260707");
    expect(r.allDay).toBe(true);
    expect(r.iso.startsWith("2026-07-07")).toBe(true);
  });
});

describe("parseRrule", () => {
  it("parses frequency + interval", () => {
    expect(parseRrule("FREQ=DAILY;INTERVAL=2")).toEqual({ frequency: "daily", interval: 2 });
  });
  it("parses COUNT and BYDAY", () => {
    const rule = parseRrule("FREQ=WEEKLY;COUNT=5;BYDAY=MO,WE,FR")!;
    expect(rule.count).toBe(5);
    expect(rule.byWeekday).toEqual(["MO", "WE", "FR"]);
  });
  it("returns null for an unknown frequency", () => {
    expect(parseRrule("FREQ=HOURLY")).toBeNull();
  });
});

describe("importIcs", () => {
  it("imports every VEVENT", () => {
    const events = importIcs(SAMPLE);
    expect(events).toHaveLength(2);
  });
  it("maps summary, times and location", () => {
    const [first] = importIcs(SAMPLE);
    expect(first!.title).toBe("Team Standup");
    expect(first!.location).toBe("Zoom");
    expect(first!.startAt).toBe("2026-07-07T09:00:00.000Z");
    expect(first!.status).toBe("confirmed");
    expect(first!.source).toBe("ics");
  });
  it("attaches a recurrence rule", () => {
    const events = importIcs(SAMPLE);
    expect(events[1]!.recurrenceRule?.frequency).toBe("weekly");
    expect(events[1]!.recurrenceRule?.byWeekday).toEqual(["WE"]);
  });
  it("handles line folding (single leading whitespace removed)", () => {
    const folded =
      "BEGIN:VEVENT\r\nSUMMARY:Long\r\n title\r\nDTSTART:20260707T090000Z\r\nDTEND:20260707T100000Z\r\nEND:VEVENT";
    expect(importIcs(folded)[0]!.title).toBe("Longtitle");
  });
  it("defaults an untitled event", () => {
    const events = importIcs(
      "BEGIN:VEVENT\nDTSTART:20260707T090000Z\nDTEND:20260707T100000Z\nEND:VEVENT",
    );
    expect(events[0]!.title).toBe("Untitled event");
  });
});
