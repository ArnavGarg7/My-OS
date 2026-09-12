import { describe, expect, it } from "vitest";
import {
  GOAL_TEMPLATES,
  TARGET_DATE_PRESETS,
  resolveTargetDate,
  type TargetDatePreset,
} from "./goal-templates";
import { GOAL_PRIORITIES, GOAL_TYPES } from "./constants";

const byId = (id: string) => TARGET_DATE_PRESETS.find((p) => p.id === id) as TargetDatePreset;

describe("goal templates", () => {
  it("covers every goal type with valid, editable templates", () => {
    for (const type of GOAL_TYPES) {
      const templates = GOAL_TEMPLATES[type];
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.title.trim().length).toBeGreaterThan(0);
        expect(GOAL_PRIORITIES).toContain(t.priority);
        expect(TARGET_DATE_PRESETS.some((p) => p.id === t.suggestedPreset)).toBe(true);
      }
    }
  });
});

describe("resolveTargetDate", () => {
  it("returns null for no-date and custom presets", () => {
    expect(resolveTargetDate(byId("none"), "2026-09-12")).toBeNull();
    expect(resolveTargetDate(byId("custom"), "2026-09-12")).toBeNull();
  });

  it("resolves end of the current month", () => {
    expect(resolveTargetDate(byId("eom"), "2026-09-12")).toBe("2026-09-30");
    expect(resolveTargetDate(byId("eom"), "2026-02-01")).toBe("2026-02-28");
  });

  it("resolves end of the current year", () => {
    expect(resolveTargetDate(byId("eoy"), "2026-09-12")).toBe("2026-12-31");
  });

  it("adds months and rolls over the year", () => {
    expect(resolveTargetDate(byId("m3"), "2026-09-12")).toBe("2026-12-12");
    expect(resolveTargetDate(byId("m6"), "2026-09-12")).toBe("2027-03-12");
    expect(resolveTargetDate(byId("y1"), "2026-09-12")).toBe("2027-09-12");
  });

  it("is deterministic for the same inputs", () => {
    expect(resolveTargetDate(byId("m3"), "2026-01-31")).toBe(
      resolveTargetDate(byId("m3"), "2026-01-31"),
    );
  });
});
