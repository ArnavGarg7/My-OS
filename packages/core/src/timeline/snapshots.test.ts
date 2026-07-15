import { describe, expect, it } from "vitest";
import { buildSnapshot, buildSnapshots, periodBounds } from "./snapshots";
import { day, makeStream } from "./fixtures";

describe("periodBounds", () => {
  it("computes a week (Mon–Sun)", () => {
    // 2026-07-03 is a Friday.
    const { start, end } = periodBounds("week", day(2026, 6, 3));
    expect(start).toBe(day(2026, 5, 29)); // Mon Jun 29
    expect(end).toBe(day(2026, 6, 5)); // Sun Jul 5
  });
  it("computes a month", () => {
    expect(periodBounds("month", day(2026, 6, 15))).toEqual({
      start: day(2026, 6, 1),
      end: day(2026, 6, 31),
    });
  });
  it("computes a quarter", () => {
    expect(periodBounds("quarter", day(2026, 6, 15))).toEqual({
      start: day(2026, 6, 1),
      end: day(2026, 8, 30),
    });
  });
  it("computes a year", () => {
    expect(periodBounds("year", day(2026, 6, 15))).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });
});

describe("buildSnapshot", () => {
  it("summarises events in the period", () => {
    const snap = buildSnapshot(makeStream(), "month", day(2026, 6, 15));
    expect(snap.metadata.eventCount).toBe(5);
    expect(snap.metadata.activeDays).toBe(3);
    expect(snap.metadata.topSources[0]!.source).toBe("goal"); // 2 events
    expect(snap.summary).toContain("5 events");
  });
  it("reports emptiness for a quiet period", () => {
    const snap = buildSnapshot(makeStream(), "month", day(2020, 0, 15));
    expect(snap.metadata.eventCount).toBe(0);
    expect(snap.summary).toContain("No activity");
  });
});

describe("buildSnapshots", () => {
  it("builds one per requested type", () => {
    const snaps = buildSnapshots(makeStream(), day(2026, 6, 3), ["week", "month"]);
    expect(snaps.map((s) => s.snapshotType)).toEqual(["week", "month"]);
  });
});
