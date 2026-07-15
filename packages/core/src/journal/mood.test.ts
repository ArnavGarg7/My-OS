import { describe, expect, it } from "vitest";
import { at, makeEntry } from "./fixtures";
import { moodTrend, shiftDate, writingStreak } from "./mood";

describe("mood", () => {
  it("returns an empty trend with no mood entries", () => {
    const t = moodTrend([makeEntry({ mood: null })]);
    expect(t.samples).toBe(0);
    expect(t.average).toBe(0);
    expect(t.direction).toBe("unknown");
  });

  it("averages mood scores", () => {
    const entries = [
      makeEntry({ id: "a", mood: "good", createdAt: at(2026, 6, 5) }),
      makeEntry({ id: "b", mood: "excellent", createdAt: at(2026, 6, 6) }),
    ];
    expect(moodTrend(entries).average).toBe(4.5);
  });

  it("detects an upward mood trend", () => {
    const entries = [
      makeEntry({ id: "a", mood: "low", createdAt: at(2026, 6, 4) }),
      makeEntry({ id: "b", mood: "low", createdAt: at(2026, 6, 5) }),
      makeEntry({ id: "c", mood: "good", createdAt: at(2026, 6, 6) }),
      makeEntry({ id: "d", mood: "excellent", createdAt: at(2026, 6, 7) }),
    ];
    expect(moodTrend(entries).direction).toBe("up");
  });

  it("tracks the mood distribution + latest", () => {
    const entries = [
      makeEntry({ id: "a", mood: "good", createdAt: at(2026, 6, 6) }),
      makeEntry({ id: "b", mood: "neutral", createdAt: at(2026, 6, 7) }),
    ];
    const t = moodTrend(entries);
    expect(t.distribution.good).toBe(1);
    expect(t.latest).toBe("neutral");
  });

  it("shifts dates by days", () => {
    expect(shiftDate("2026-07-07", -1)).toBe("2026-07-06");
    expect(shiftDate("2026-07-31", 1)).toBe("2026-08-01");
  });

  it("computes a current writing streak ending today", () => {
    const entries = [
      makeEntry({ id: "a", createdAt: at(2026, 6, 5) }),
      makeEntry({ id: "b", createdAt: at(2026, 6, 6) }),
      makeEntry({ id: "c", createdAt: at(2026, 6, 7) }),
    ];
    expect(writingStreak(entries, "2026-07-07").current).toBe(3);
  });

  it("counts a streak ending yesterday when today is empty", () => {
    const entries = [
      makeEntry({ id: "a", createdAt: at(2026, 6, 5) }),
      makeEntry({ id: "b", createdAt: at(2026, 6, 6) }),
    ];
    expect(writingStreak(entries, "2026-07-07").current).toBe(2);
  });

  it("breaks the streak on a gap", () => {
    const entries = [
      makeEntry({ id: "a", createdAt: at(2026, 6, 1) }),
      makeEntry({ id: "b", createdAt: at(2026, 6, 7) }),
    ];
    const streak = writingStreak(entries, "2026-07-07");
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(1);
  });

  it("computes the longest streak", () => {
    const entries = [
      makeEntry({ id: "a", createdAt: at(2026, 6, 1) }),
      makeEntry({ id: "b", createdAt: at(2026, 6, 2) }),
      makeEntry({ id: "c", createdAt: at(2026, 6, 3) }),
      makeEntry({ id: "d", createdAt: at(2026, 6, 7) }),
    ];
    expect(writingStreak(entries, "2026-07-07").longest).toBe(3);
  });

  it("returns a zero streak with no entries", () => {
    expect(writingStreak([], "2026-07-07")).toEqual({
      current: 0,
      longest: 0,
      lastEntryDate: null,
    });
  });
});
