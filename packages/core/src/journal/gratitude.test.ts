import { describe, expect, it } from "vitest";
import { makeReflection } from "./fixtures";
import {
  addGratitude,
  allGratitude,
  gratitudeCount,
  gratitudeDays,
  gratitudeForDate,
} from "./gratitude";

describe("gratitude", () => {
  it("reads gratitude for a date", () => {
    const list = [makeReflection({ date: "2026-07-07", gratitude: ["family", "health"] })];
    expect(gratitudeForDate(list, "2026-07-07")).toEqual(["family", "health"]);
    expect(gratitudeForDate(list, "2026-07-08")).toEqual([]);
  });

  it("aggregates + counts gratitude", () => {
    const list = [
      makeReflection({ id: "a", gratitude: ["a", "b"] }),
      makeReflection({ id: "b", gratitude: ["c"] }),
    ];
    expect(allGratitude(list)).toEqual(["a", "b", "c"]);
    expect(gratitudeCount(list)).toBe(3);
  });

  it("counts days with gratitude", () => {
    const list = [
      makeReflection({ id: "a", gratitude: ["x"] }),
      makeReflection({ id: "b", gratitude: [] }),
    ];
    expect(gratitudeDays(list)).toBe(1);
  });

  it("adds gratitude without duplicates", () => {
    const r = makeReflection({ gratitude: ["coffee"] });
    expect(addGratitude(r, "coffee").gratitude).toEqual(["coffee"]);
    expect(addGratitude(r, "sun").gratitude).toEqual(["coffee", "sun"]);
  });
});
