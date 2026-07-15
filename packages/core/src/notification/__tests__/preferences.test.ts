import { describe, expect, it } from "vitest";
import {
  categoryPreference,
  defaultPreferences,
  isCategoryEnabled,
  isWeekend,
  updateCategory,
} from "../preferences";

describe("preferences", () => {
  it("builds defaults for every category", () => {
    const prefs = defaultPreferences();
    expect(prefs.categories).toHaveLength(13);
    expect(prefs.muted).toBe(false);
    expect(prefs.quietHours.enabled).toBe(true);
  });

  it("looks up a category preference", () => {
    const prefs = defaultPreferences();
    expect(categoryPreference(prefs, "calendar").sound).toBe(true);
    expect(isCategoryEnabled(prefs, "reminder")).toBe(true);
  });

  it("updates a category immutably", () => {
    const prefs = defaultPreferences();
    const next = updateCategory(prefs, "reminder", { enabled: false });
    expect(isCategoryEnabled(next, "reminder")).toBe(false);
    expect(isCategoryEnabled(prefs, "reminder")).toBe(true); // original unchanged
  });

  it("adds a missing category on update", () => {
    const prefs = { ...defaultPreferences(), categories: [] };
    const next = updateCategory(prefs, "focus", { desktop: true });
    expect(categoryPreference(next, "focus").desktop).toBe(true);
  });

  it("detects weekends", () => {
    expect(isWeekend(new Date("2026-07-18T12:00:00Z"), "UTC")).toBe(true); // Saturday
    expect(isWeekend(new Date("2026-07-15T12:00:00Z"), "UTC")).toBe(false); // Wednesday
  });
});
