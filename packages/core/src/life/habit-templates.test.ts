import { describe, expect, it } from "vitest";
import { HABIT_SUGGESTIONS } from "./habit-templates";
import { HABIT_FREQUENCIES } from "./constants";

describe("habit suggestions", () => {
  it("offers a non-empty menu of uniquely-named habits", () => {
    expect(HABIT_SUGGESTIONS.length).toBeGreaterThan(0);
    const names = HABIT_SUGGESTIONS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("uses only valid frequencies and non-empty names", () => {
    for (const s of HABIT_SUGGESTIONS) {
      expect(s.name.trim().length).toBeGreaterThan(0);
      expect(HABIT_FREQUENCIES).toContain(s.frequency);
    }
  });
});
