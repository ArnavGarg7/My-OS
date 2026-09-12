import { describe, expect, it } from "vitest";
import { CATEGORY_CATALOG, categoriesForGroup, findCategory } from "./categories";

describe("finance category catalog", () => {
  it("has unique lowercase ids in both groups", () => {
    const ids = CATEGORY_CATALOG.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CATEGORY_CATALOG) {
      expect(c.id).toBe(c.id.toLowerCase());
      expect(c.label.trim().length).toBeGreaterThan(0);
      expect(c.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it("splits into non-empty expense and income groups", () => {
    expect(categoriesForGroup("expense").length).toBeGreaterThan(0);
    expect(categoriesForGroup("income").length).toBeGreaterThan(0);
    expect(categoriesForGroup("expense").every((c) => c.group === "expense")).toBe(true);
  });

  it("finds categories case-insensitively and returns undefined for unknowns", () => {
    expect(findCategory("GROCERIES")?.id).toBe("groceries");
    expect(findCategory("  dining ")?.id).toBe("dining");
    expect(findCategory("nonsense")).toBeUndefined();
  });
});
