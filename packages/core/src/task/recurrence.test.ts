import { describe, expect, it } from "vitest";
import {
  formatRecurrence,
  isRecurrenceFrequency,
  nextOccurrence,
  parseRecurrence,
} from "./recurrence";

const base = new Date("2026-07-07T10:00:00.000Z");

describe("nextOccurrence", () => {
  it("advances daily by interval", () => {
    expect(nextOccurrence({ frequency: "daily", interval: 1 }, base).toISOString()).toBe(
      "2026-07-08T10:00:00.000Z",
    );
    expect(nextOccurrence({ frequency: "daily", interval: 3 }, base).toISOString()).toBe(
      "2026-07-10T10:00:00.000Z",
    );
  });

  it("advances weekly", () => {
    expect(nextOccurrence({ frequency: "weekly", interval: 1 }, base).toISOString()).toBe(
      "2026-07-14T10:00:00.000Z",
    );
  });

  it("advances monthly", () => {
    expect(nextOccurrence({ frequency: "monthly", interval: 1 }, base).toISOString()).toBe(
      "2026-08-07T10:00:00.000Z",
    );
  });

  it("advances yearly", () => {
    expect(nextOccurrence({ frequency: "yearly", interval: 1 }, base).toISOString()).toBe(
      "2027-07-07T10:00:00.000Z",
    );
  });
});

describe("parseRecurrence", () => {
  it("parses daily/weekly/monthly/yearly words", () => {
    expect(parseRecurrence("water plants daily")).toEqual({ frequency: "daily", interval: 1 });
    expect(parseRecurrence("standup every week")).toEqual({ frequency: "weekly", interval: 1 });
    expect(parseRecurrence("rent monthly")).toEqual({ frequency: "monthly", interval: 1 });
  });

  it("parses 'every N units'", () => {
    expect(parseRecurrence("deploy every 2 weeks")).toEqual({ frequency: "weekly", interval: 2 });
    expect(parseRecurrence("review every 3 days")).toEqual({ frequency: "daily", interval: 3 });
  });

  it("maps 'every monday' to weekly", () => {
    expect(parseRecurrence("gym every monday")).toEqual({ frequency: "weekly", interval: 1 });
  });

  it("returns null when there is no recurrence", () => {
    expect(parseRecurrence("buy milk tomorrow")).toBeNull();
  });
});

describe("formatRecurrence", () => {
  it("formats singular + plural", () => {
    expect(formatRecurrence({ frequency: "daily", interval: 1 })).toBe("Every day");
    expect(formatRecurrence({ frequency: "weekly", interval: 2 })).toBe("Every 2 weeks");
  });
});

describe("isRecurrenceFrequency", () => {
  it("guards valid frequencies", () => {
    expect(isRecurrenceFrequency("weekly")).toBe(true);
    expect(isRecurrenceFrequency("hourly")).toBe(false);
  });
});
