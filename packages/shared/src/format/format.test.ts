import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatCountdown,
  formatCurrency,
  formatDuration,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
} from "./index";

describe("format/date", () => {
  it("formats durations in short + clock styles", () => {
    expect(formatDuration(130)).toBe("2h 10m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(90, { style: "clock" })).toBe("01:30:00");
    expect(formatDuration(3600, { unit: "seconds", style: "clock" })).toBe("01:00:00");
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats relative time", () => {
    const base = new Date("2026-07-06T12:00:00Z");
    expect(formatRelativeTime(new Date("2026-07-06T10:00:00Z"), { base })).toBe("2 hours ago");
    expect(formatRelativeTime(new Date("2026-07-09T12:00:00Z"), { base })).toBe("in 3 days");
  });

  it("formats a clamped countdown", () => {
    const base = new Date("2026-07-06T12:00:00Z");
    expect(formatCountdown(new Date("2026-07-06T14:14:33Z"), { base })).toBe("02:14:33");
    expect(formatCountdown(new Date("2026-07-06T11:00:00Z"), { base })).toBe("00:00:00");
  });
});

describe("format/number", () => {
  it("formats numbers and compact notation", () => {
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(1200, { notation: "compact" })).toMatch(/1\.2K/i);
  });

  it("formats currency from minor units", () => {
    const formatted = formatCurrency(125000, { fromMinor: true });
    expect(formatted).toContain("1,250");
    expect(formatted).toMatch(/₹|INR/);
  });

  it("formats percentages from a ratio", () => {
    expect(formatPercentage(0.72)).toBe("72%");
    expect(formatPercentage(72, { isRatio: false })).toBe("72%");
  });
});

describe("format/bytes", () => {
  it("formats binary + decimal byte sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KiB");
    expect(formatFileSize(1500)).toBe("1.5 KB");
  });
});
