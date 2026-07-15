import { describe, expect, it } from "vitest";
import {
  dateKeyInZone,
  minutesBetween,
  offsetMinutes,
  timeInZone,
  timezonesDiffer,
} from "./timezone";

describe("minutesBetween", () => {
  it("computes elapsed minutes", () => {
    expect(minutesBetween("2026-07-07T09:00:00.000Z", "2026-07-07T10:30:00.000Z")).toBe(90);
  });
});

describe("dateKeyInZone", () => {
  it("returns the local date in a zone", () => {
    expect(dateKeyInZone("2026-07-07T12:00:00.000Z", "UTC")).toBe("2026-07-07");
  });
  it("rolls the date across a timezone boundary", () => {
    // 23:30 UTC in New York is still the same day earlier
    expect(dateKeyInZone("2026-07-07T02:00:00.000Z", "America/New_York")).toBe("2026-07-06");
  });
});

describe("timeInZone", () => {
  it("formats HH:MM in a zone", () => {
    expect(timeInZone("2026-07-07T09:00:00.000Z", "UTC")).toBe("09:00");
  });
});

describe("offsetMinutes", () => {
  it("is zero for UTC", () => {
    expect(offsetMinutes("2026-07-07T09:00:00.000Z", "UTC")).toBe(0);
  });
  it("is negative for western zones", () => {
    expect(offsetMinutes("2026-07-07T09:00:00.000Z", "America/New_York")).toBeLessThan(0);
  });
  it("returns 0 for an invalid zone", () => {
    expect(offsetMinutes("2026-07-07T09:00:00.000Z", "Not/AZone")).toBe(0);
  });
});

describe("timezonesDiffer", () => {
  it("compares zone labels", () => {
    expect(timezonesDiffer("UTC", "UTC")).toBe(false);
    expect(timezonesDiffer("UTC", "Asia/Kolkata")).toBe(true);
  });
});
