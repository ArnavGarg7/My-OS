import { describe, expect, it } from "vitest";
import { exportIcs, rruleToString } from "./exporter";
import { importIcs } from "./importer";
import { iso, makeEvent } from "./fixtures";

describe("rruleToString", () => {
  it("serializes frequency, interval and count", () => {
    expect(rruleToString({ frequency: "daily", interval: 2, count: 5 })).toBe(
      "FREQ=DAILY;INTERVAL=2;COUNT=5",
    );
  });
  it("serializes BYDAY", () => {
    expect(rruleToString({ frequency: "weekly", interval: 1, byWeekday: ["MO", "WE"] })).toBe(
      "FREQ=WEEKLY;BYDAY=MO,WE",
    );
  });
});

describe("exportIcs", () => {
  it("wraps events in a VCALENDAR", () => {
    const ics = exportIcs([makeEvent({ id: "e1", title: "Meeting" })]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Meeting");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("escapes special characters", () => {
    const ics = exportIcs([makeEvent({ title: "A, B; C" })]);
    expect(ics).toContain("SUMMARY:A\\, B\\; C");
  });

  it("includes a recurrence rule", () => {
    const ics = exportIcs([makeEvent({ recurrenceRule: { frequency: "daily", interval: 1 } })]);
    expect(ics).toContain("RRULE:FREQ=DAILY");
  });

  it("round-trips title and times through import", () => {
    const event = makeEvent({ id: "e1", title: "Design Review", startAt: iso(14), endAt: iso(15) });
    const reimported = importIcs(exportIcs([event]));
    expect(reimported[0]!.title).toBe("Design Review");
    expect(reimported[0]!.startAt).toBe(event.startAt);
    expect(reimported[0]!.endAt).toBe(event.endAt);
  });

  it("emits an UNTIL clause", () => {
    const ics = exportIcs([
      makeEvent({ recurrenceRule: { frequency: "daily", interval: 1, until: iso(9) } }),
    ]);
    expect(ics).toContain("UNTIL=");
  });

  it("round-trips a recurrence rule", () => {
    const event = makeEvent({
      recurrenceRule: { frequency: "weekly", interval: 2, byWeekday: ["TU"] },
    });
    const reimported = importIcs(exportIcs([event]));
    expect(reimported[0]!.recurrenceRule).toMatchObject({
      frequency: "weekly",
      interval: 2,
      byWeekday: ["TU"],
    });
  });
});
