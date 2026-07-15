import { describe, expect, it } from "vitest";
import {
  cumulativeSeries,
  forecastEventVolume,
  forecastFromSeries,
  forecastProgress,
} from "./forecasting";
import { at, ev } from "./fixtures";

describe("forecastFromSeries", () => {
  it("extends a rising series by its velocity", () => {
    const series = [
      { date: "2026-07-01", value: 10 },
      { date: "2026-07-02", value: 20 },
      { date: "2026-07-03", value: 30 },
    ];
    const f = forecastFromSeries("m", series, 3);
    expect(f.velocityPerDay).toBe(10);
    expect(f.projected).toBe(60);
    expect(f.basis).toBe("historical-velocity");
  });
  it("is flat for a constant series", () => {
    const series = [
      { date: "2026-07-01", value: 5 },
      { date: "2026-07-02", value: 5 },
    ];
    expect(forecastFromSeries("m", series, 10).velocityPerDay).toBe(0);
  });
});

describe("forecastEventVolume", () => {
  it("projects volume from average daily rate", () => {
    const events = [
      ev({ timestamp: at(2026, 6, 1) }),
      ev({ timestamp: at(2026, 6, 1) }),
      ev({ timestamp: at(2026, 6, 2) }),
    ];
    const f = forecastEventVolume(events, 7);
    expect(f.velocityPerDay).toBe(1.5);
    expect(f.projected).toBe(10.5);
  });
});

describe("forecastProgress", () => {
  it("caps a projection at 100", () => {
    const series = [
      { date: "2026-07-01", value: 80 },
      { date: "2026-07-02", value: 90 },
    ];
    expect(forecastProgress("goal", series, 10).projected).toBe(100);
  });
});

describe("cumulativeSeries", () => {
  it("accumulates daily counts", () => {
    const events = [
      ev({ timestamp: at(2026, 6, 1) }),
      ev({ timestamp: at(2026, 6, 2) }),
      ev({ timestamp: at(2026, 6, 2) }),
    ];
    const series = cumulativeSeries(events);
    expect(series[series.length - 1]!.value).toBe(3);
  });
  it("is monotonically non-decreasing", () => {
    const events = [
      ev({ timestamp: at(2026, 6, 1) }),
      ev({ timestamp: at(2026, 6, 3) }),
      ev({ timestamp: at(2026, 6, 3) }),
    ];
    const values = cumulativeSeries(events).map((s) => s.value);
    for (let i = 1; i < values.length; i++)
      expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!);
  });
});

describe("forecastProgress floors", () => {
  it("never projects below zero", () => {
    const series = [
      { date: "2026-07-01", value: 20 },
      { date: "2026-07-02", value: 10 },
    ];
    expect(forecastProgress("goal", series, 10).projected).toBe(0);
  });
});
