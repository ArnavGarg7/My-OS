import { describe, expect, it } from "vitest";
import { computeStreak, habitStreak, journalStreak } from "./streaks";
import { at, day, makeEvent } from "./fixtures";

function journalOn(...days: [number, number, number][]) {
  return days.map(([y, mo, d], i) =>
    makeEvent({
      id: `j${i}`,
      eventType: "journal.created",
      source: "journal",
      timestamp: at(y, mo, d, 8),
    }),
  );
}

describe("computeStreak", () => {
  it("finds the longest consecutive-day run", () => {
    const events = journalOn([2026, 6, 1], [2026, 6, 2], [2026, 6, 3], [2026, 6, 6]);
    const s = journalStreak(events, day(2026, 6, 10));
    expect(s.length).toBe(3);
    expect(s.start).toBe(day(2026, 6, 1));
    expect(s.end).toBe(day(2026, 6, 3));
    expect(s.current).toBe(false);
  });

  it("marks a run current when it reaches today or yesterday", () => {
    const events = journalOn([2026, 6, 9], [2026, 6, 10]);
    const s = journalStreak(events, day(2026, 6, 10));
    expect(s.length).toBe(2);
    expect(s.current).toBe(true);
  });

  it("dedupes multiple events on the same day", () => {
    const events = [
      ...journalOn([2026, 6, 1]),
      makeEvent({
        id: "extra",
        eventType: "journal.created",
        source: "journal",
        timestamp: at(2026, 6, 1, 20),
      }),
    ];
    const s = journalStreak(events, day(2026, 6, 5));
    expect(s.length).toBe(1);
  });

  it("returns an empty streak with no matches", () => {
    const s = computeStreak([], () => true, "None", day(2026, 6, 1));
    expect(s.length).toBe(0);
    expect(s.start).toBeNull();
  });
});

describe("habitStreak", () => {
  it("counts consecutive habit-completion days", () => {
    const events = [
      makeEvent({
        id: "h1",
        eventType: "habit.completed",
        source: "goal",
        timestamp: at(2026, 6, 1),
      }),
      makeEvent({
        id: "h2",
        eventType: "habit.completed",
        source: "goal",
        timestamp: at(2026, 6, 2),
      }),
    ];
    expect(habitStreak(events, day(2026, 6, 5)).length).toBe(2);
  });
});
