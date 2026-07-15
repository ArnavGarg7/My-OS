import { describe, expect, it } from "vitest";
import { describeRecurrence, expandRecurrence } from "./recurrence";
import { DATE, at, iso, makeEvent } from "./fixtures";

const RANGE_START = at(0).toISOString();
const RANGE_END = new Date(at(0).getTime() + 14 * 86_400_000).toISOString();

describe("expandRecurrence", () => {
  it("returns a single event when there is no rule", () => {
    const occ = expandRecurrence(makeEvent(), RANGE_START, RANGE_END);
    expect(occ).toHaveLength(1);
  });

  it("omits a single event outside the range", () => {
    const past = makeEvent({
      startAt: "2020-01-01T09:00:00.000Z",
      endAt: "2020-01-01T10:00:00.000Z",
    });
    expect(expandRecurrence(past, RANGE_START, RANGE_END)).toHaveLength(0);
  });

  it("expands a daily rule across the range", () => {
    const ev = makeEvent({ recurrenceRule: { frequency: "daily", interval: 1 } });
    expect(expandRecurrence(ev, RANGE_START, RANGE_END)).toHaveLength(14);
  });

  it("respects an interval", () => {
    const ev = makeEvent({ recurrenceRule: { frequency: "daily", interval: 2 } });
    expect(expandRecurrence(ev, RANGE_START, RANGE_END)).toHaveLength(7);
  });

  it("expands weekly", () => {
    const ev = makeEvent({ recurrenceRule: { frequency: "weekly", interval: 1 } });
    expect(expandRecurrence(ev, RANGE_START, RANGE_END)).toHaveLength(2);
  });

  it("ends after COUNT occurrences", () => {
    const ev = makeEvent({ recurrenceRule: { frequency: "daily", interval: 1, count: 3 } });
    expect(expandRecurrence(ev, RANGE_START, RANGE_END)).toHaveLength(3);
  });

  it("ends on the UNTIL date", () => {
    const until = new Date(at(9).getTime() + 2 * 86_400_000).toISOString();
    const ev = makeEvent({ recurrenceRule: { frequency: "daily", interval: 1, until } });
    // base + until 2 days later → 3 occurrences (day 0, 1, 2)
    expect(expandRecurrence(ev, RANGE_START, RANGE_END)).toHaveLength(3);
  });

  it("skips EXDATE exceptions", () => {
    const ev = makeEvent({
      recurrenceRule: { frequency: "daily", interval: 1, count: 3, exdates: [iso(9)] },
    });
    const occ = expandRecurrence(ev, RANGE_START, RANGE_END);
    // 3 generated, first excluded → 2 emitted
    expect(occ).toHaveLength(2);
  });

  it("supports weekly BYDAY (weekdays only)", () => {
    const ev = makeEvent({
      recurrenceRule: {
        frequency: "weekly",
        interval: 1,
        byWeekday: ["MO", "TU", "WE", "TH", "FR"],
      },
    });
    const occ = expandRecurrence(ev, RANGE_START, RANGE_END);
    // no weekend occurrences
    const weekdays = occ.map((o) => new Date(o.startAt).getDay());
    expect(weekdays.every((d) => d >= 1 && d <= 5)).toBe(true);
    expect(occ.length).toBeGreaterThan(5);
  });

  it("expands monthly", () => {
    const ev = makeEvent({ recurrenceRule: { frequency: "monthly", interval: 1 } });
    const wide = new Date(at(0).getTime() + 100 * 86_400_000).toISOString();
    expect(expandRecurrence(ev, RANGE_START, wide).length).toBeGreaterThanOrEqual(3);
  });

  it("sets recurrenceParent on occurrences", () => {
    const ev = makeEvent({
      id: "parent",
      recurrenceRule: { frequency: "daily", interval: 1, count: 2 },
    });
    const occ = expandRecurrence(ev, RANGE_START, RANGE_END);
    expect(occ[0]!.recurrenceParent).toBe("parent");
    expect(occ[0]!.recurrenceRule).toBeNull();
  });

  it("expands yearly across a wide range", () => {
    const ev = makeEvent({ recurrenceRule: { frequency: "yearly", interval: 1 } });
    const wide = new Date(at(0).getTime() + 800 * 86_400_000).toISOString();
    expect(expandRecurrence(ev, RANGE_START, wide).length).toBeGreaterThanOrEqual(2);
  });

  it("caps weekly BYDAY by COUNT", () => {
    const ev = makeEvent({
      recurrenceRule: { frequency: "weekly", interval: 1, byWeekday: ["MO", "WE", "FR"], count: 4 },
    });
    expect(expandRecurrence(ev, RANGE_START, RANGE_END)).toHaveLength(4);
  });

  it("preserves duration in occurrences", () => {
    const ev = makeEvent({
      startAt: iso(9),
      endAt: iso(10, 30),
      recurrenceRule: { frequency: "daily", interval: 1, count: 2 },
    });
    const occ = expandRecurrence(ev, RANGE_START, RANGE_END);
    const mins = (new Date(occ[0]!.endAt).getTime() - new Date(occ[0]!.startAt).getTime()) / 60_000;
    expect(mins).toBe(90);
  });
});

describe("describeRecurrence", () => {
  it("describes common rules", () => {
    expect(describeRecurrence({ frequency: "daily", interval: 1 })).toBe("Every day");
    expect(describeRecurrence({ frequency: "weekly", interval: 2 })).toBe("Every 2 weeks");
    expect(
      describeRecurrence({ frequency: "weekly", interval: 1, byWeekday: ["MO", "WE"] }),
    ).toMatch(/MO, WE/);
  });
  it("mentions the date fixture is a Tuesday", () => {
    expect(new Date(`${DATE}T00:00:00`).getDay()).toBe(2);
  });
});
