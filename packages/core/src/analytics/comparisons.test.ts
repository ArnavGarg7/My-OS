import { describe, expect, it } from "vitest";
import { compareEventVolume, compareKind, compareValues } from "./comparisons";
import { at, ev } from "./fixtures";

const NOW = new Date(at(2026, 6, 14, 23));

describe("compareValues", () => {
  it("computes delta, change % + direction", () => {
    const c = compareValues("m", "previous_week", 120, 100);
    expect(c.delta).toBe(20);
    expect(c.changePercent).toBe(20);
    expect(c.direction).toBe("up");
  });
  it("treats a tiny change as flat", () => {
    expect(compareValues("m", "previous_week", 100, 100).direction).toBe("flat");
  });
  it("handles a zero baseline", () => {
    expect(compareValues("m", "previous_week", 5, 0).changePercent).toBe(100);
    expect(compareValues("m", "previous_week", 0, 0).changePercent).toBe(0);
  });
});

describe("compareEventVolume", () => {
  it("compares this week vs last week", () => {
    const events = [
      // this week (Jul 8–14)
      ev({ timestamp: at(2026, 6, 14) }),
      ev({ timestamp: at(2026, 6, 13) }),
      // last week (Jul 1–7)
      ev({ timestamp: at(2026, 6, 5) }),
    ];
    const c = compareEventVolume(events, "previous_week", NOW);
    expect(c.current).toBe(2);
    expect(c.previous).toBe(1);
    expect(c.direction).toBe("up");
  });
  it("compares a specific kind", () => {
    const events = [
      ev({ eventType: "task.completed", timestamp: at(2026, 6, 14) }),
      ev({ eventType: "task.completed", timestamp: at(2026, 6, 5) }),
    ];
    const c = compareKind(events, "task.completed", "previous_week", NOW);
    expect(c.current).toBe(1);
    expect(c.previous).toBe(1);
  });

  it("reports a down direction when this period is quieter", () => {
    const events = [
      ev({ timestamp: at(2026, 6, 3) }),
      ev({ timestamp: at(2026, 6, 4) }),
      ev({ timestamp: at(2026, 6, 5) }),
      ev({ timestamp: at(2026, 6, 14) }),
    ];
    const c = compareEventVolume(events, "previous_week", NOW);
    expect(c.current).toBe(1);
    expect(c.previous).toBe(3);
    expect(c.direction).toBe("down");
  });

  it("supports a day-over-day comparison", () => {
    const now = new Date(at(2026, 6, 14, 23));
    const events = [ev({ timestamp: at(2026, 6, 14) }), ev({ timestamp: at(2026, 6, 13) })];
    const c = compareEventVolume(events, "previous_day", now);
    expect(c.current).toBe(1);
    expect(c.previous).toBe(1);
  });
});
