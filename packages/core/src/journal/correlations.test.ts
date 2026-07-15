import { describe, expect, it } from "vitest";
import { at, makeEntry } from "./fixtures";
import { correlateMood, pearson, strengthOf } from "./correlations";

describe("correlations", () => {
  it("computes a perfect positive correlation", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 5);
  });

  it("returns 0 with no variance", () => {
    expect(pearson([5, 5, 5], [1, 2, 3])).toBe(0);
  });

  it("classifies strength", () => {
    expect(strengthOf(0.1)).toBe("none");
    expect(strengthOf(0.5)).toBe("moderate");
    expect(strengthOf(0.9)).toBe("strong");
  });

  it("correlates mood against a daily metric aligned by date", () => {
    const entries = [
      makeEntry({ id: "a", mood: "low", createdAt: at(2026, 6, 5) }),
      makeEntry({ id: "b", mood: "good", createdAt: at(2026, 6, 6) }),
      makeEntry({ id: "c", mood: "excellent", createdAt: at(2026, 6, 7) }),
    ];
    const sleep = new Map([
      ["2026-07-05", 360],
      ["2026-07-06", 450],
      ["2026-07-07", 500],
    ]);
    const c = correlateMood(entries, "sleep", sleep);
    expect(c.samples).toBe(3);
    expect(c.coefficient).toBeGreaterThan(0.9);
    expect(c.strength).toBe("strong");
  });

  it("returns 0 correlation without overlapping days", () => {
    const entries = [makeEntry({ mood: "good", createdAt: at(2026, 6, 7) })];
    expect(correlateMood(entries, "sleep", new Map()).samples).toBe(0);
  });
});
