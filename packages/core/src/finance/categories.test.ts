import { describe, expect, it } from "vitest";
import {
  CATEGORY_CATALOG,
  CATEGORY_ICON_KEYS,
  categoriesForGroup,
  findCategory,
  isBuiltInCategory,
  slugifyCategory,
} from "./categories";

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
    expect(isBuiltInCategory("groceries")).toBe(true);
    expect(isBuiltInCategory("pet-care")).toBe(false);
  });

  it("only uses icon keys that exist in the shared icon-key set", () => {
    for (const c of CATEGORY_CATALOG) {
      expect(CATEGORY_ICON_KEYS).toContain(c.icon);
    }
  });
});

describe("slugifyCategory", () => {
  it("lowercases and hyphenates, trimming stray separators", () => {
    expect(slugifyCategory("Pet Care")).toBe("pet-care");
    expect(slugifyCategory("  Coffee & Tea!  ")).toBe("coffee-tea");
    expect(slugifyCategory("Rent/Utilities")).toBe("rent-utilities");
  });

  it("returns an empty string when there are no usable characters", () => {
    expect(slugifyCategory("   ")).toBe("");
    expect(slugifyCategory("!!!")).toBe("");
  });
});
