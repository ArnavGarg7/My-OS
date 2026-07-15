import { describe, expect, it } from "vitest";
import { at, makeBody } from "./fixtures";
import { bodyFatTrend, latestMeasurement, weightTrend } from "./body";

describe("body", () => {
  it("finds the latest measurement by recordedAt", () => {
    const list = [
      makeBody({ id: "a", weight: 76, recordedAt: at(7, 0, 5) }),
      makeBody({ id: "b", weight: 75, recordedAt: at(7, 0, 7) }),
    ];
    expect(latestMeasurement(list)?.id).toBe("b");
  });

  it("returns null latest for an empty list", () => {
    expect(latestMeasurement([])).toBeNull();
  });

  it("computes a downward weight trend", () => {
    const list = [
      makeBody({ id: "a", weight: 77, recordedAt: at(7, 0, 5) }),
      makeBody({ id: "b", weight: 75, recordedAt: at(7, 0, 7) }),
    ];
    const t = weightTrend(list);
    expect(t.latest).toBe(75);
    expect(t.change).toBe(-2);
    expect(t.direction).toBe("down");
  });

  it("reports unknown trend without data", () => {
    const t = weightTrend([makeBody({ weight: null })]);
    expect(t.direction).toBe("unknown");
    expect(t.latest).toBeNull();
  });

  it("averages recent measurements", () => {
    const list = [
      makeBody({ id: "a", weight: 74, recordedAt: at(7, 0, 5) }),
      makeBody({ id: "b", weight: 76, recordedAt: at(7, 0, 7) }),
    ];
    expect(weightTrend(list).average).toBe(75);
  });

  it("tracks body fat separately", () => {
    const list = [
      makeBody({ id: "a", bodyFat: 20, recordedAt: at(7, 0, 5) }),
      makeBody({ id: "b", bodyFat: 18, recordedAt: at(7, 0, 7) }),
    ];
    expect(bodyFatTrend(list).direction).toBe("down");
  });
});
