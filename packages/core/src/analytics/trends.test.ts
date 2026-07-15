import { describe, expect, it } from "vitest";
import { direction, eventVolumeTrend, kindTrend, trendOfSeries } from "./trends";
import { at, ev } from "./fixtures";

const NOW = new Date(at(2026, 6, 14, 12));

describe("direction", () => {
  it("classifies by threshold", () => {
    expect(direction(10)).toBe("up");
    expect(direction(-10)).toBe("down");
    expect(direction(1)).toBe("flat");
  });
});

describe("trendOfSeries", () => {
  it("detects an upward trend", () => {
    const series = [
      { date: "2026-07-08", value: 1 },
      { date: "2026-07-09", value: 1 },
      { date: "2026-07-13", value: 5 },
      { date: "2026-07-14", value: 5 },
    ];
    const t = trendOfSeries("m", series, "week", NOW);
    expect(t.direction).toBe("up");
    expect(t.changePercent).toBeGreaterThan(0);
  });
  it("detects a downward trend", () => {
    const series = [
      { date: "2026-07-08", value: 8 },
      { date: "2026-07-09", value: 8 },
      { date: "2026-07-13", value: 2 },
      { date: "2026-07-14", value: 2 },
    ];
    expect(trendOfSeries("m", series, "week", NOW).direction).toBe("down");
  });
});

describe("event trends", () => {
  it("computes event-volume trend", () => {
    const events = [
      ev({ timestamp: at(2026, 6, 8) }),
      ev({ timestamp: at(2026, 6, 13) }),
      ev({ timestamp: at(2026, 6, 14) }),
    ];
    const t = eventVolumeTrend(events, "week", NOW);
    expect(t.metric).toBe("timeline.events");
    expect(["up", "down", "flat"]).toContain(t.direction);
  });
  it("computes a kind-specific trend", () => {
    const events = [
      ev({ eventType: "task.completed", timestamp: at(2026, 6, 14) }),
      ev({ eventType: "task.created", timestamp: at(2026, 6, 8) }),
    ];
    expect(kindTrend(events, "task.completed", "week", NOW).metric).toBe("task.completed");
  });
});
