import { describe, expect, it } from "vitest";
import {
  defaultQuietHours,
  isMinuteWithin,
  isWithinQuietHours,
  minutesOfDayInTz,
  minutesUntilQuietEnd,
  parseHHMM,
  quietHoursFromSleep,
} from "../quiet-hours";

describe("quiet hours", () => {
  it("parses HH:MM to minutes", () => {
    expect(parseHHMM("22:00")).toBe(1320);
    expect(parseHHMM("07:30")).toBe(450);
    expect(parseHHMM("00:00")).toBe(0);
  });

  it("handles daytime windows", () => {
    expect(isMinuteWithin(600, 540, 1020)).toBe(true); // 10:00 within 9–17
    expect(isMinuteWithin(1100, 540, 1020)).toBe(false);
  });

  it("handles overnight windows", () => {
    expect(isMinuteWithin(1350, 1320, 420)).toBe(true); // 22:30 within 22:00–07:00
    expect(isMinuteWithin(120, 1320, 420)).toBe(true); // 02:00 within
    expect(isMinuteWithin(600, 1320, 420)).toBe(false); // 10:00 not within
  });

  it("empty window is never within", () => {
    expect(isMinuteWithin(600, 600, 600)).toBe(false);
  });

  it("computes minutes-of-day in a timezone", () => {
    const noonUtc = new Date("2026-07-11T12:00:00Z");
    expect(minutesOfDayInTz(noonUtc, "UTC")).toBe(720);
  });

  it("detects within quiet hours (overnight, UTC)", () => {
    const quiet = { enabled: true, start: "22:00", end: "07:00" };
    expect(isWithinQuietHours(quiet, new Date("2026-07-11T23:00:00Z"), "UTC")).toBe(true);
    expect(isWithinQuietHours(quiet, new Date("2026-07-11T12:00:00Z"), "UTC")).toBe(false);
  });

  it("disabled quiet hours is never within", () => {
    const quiet = { enabled: false, start: "22:00", end: "07:00" };
    expect(isWithinQuietHours(quiet, new Date("2026-07-11T23:00:00Z"), "UTC")).toBe(false);
  });

  it("computes minutes until quiet end", () => {
    const quiet = { enabled: true, start: "22:00", end: "07:00" };
    // 23:00 → 8h to 07:00 = 480 min
    expect(minutesUntilQuietEnd(quiet, new Date("2026-07-11T23:00:00Z"), "UTC")).toBe(480);
    // daytime → 0
    expect(minutesUntilQuietEnd(quiet, new Date("2026-07-11T12:00:00Z"), "UTC")).toBe(0);
  });

  it("default quiet hours are 22:00–07:00 enabled", () => {
    expect(defaultQuietHours()).toEqual({ enabled: true, start: "22:00", end: "07:00" });
  });

  it("derives quiet hours from a sleep window", () => {
    const base = defaultQuietHours();
    expect(quietHoursFromSleep("23:00", "06:30", base)).toEqual({
      enabled: true,
      start: "23:00",
      end: "06:30",
    });
    expect(quietHoursFromSleep(null, "06:30", base)).toEqual(base);
  });
});
