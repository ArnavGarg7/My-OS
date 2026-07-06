import { describe, expect, it } from "vitest";
import { getNavItem, NAV_HREFS, NAV_ITEMS, NAV_SECTIONS, resolveActive } from "./nav";

describe("nav config", () => {
  it("has the five expected sections in order", () => {
    expect(NAV_SECTIONS.map((s) => s.label)).toEqual([
      "Main",
      "Work",
      "Life",
      "Insights",
      "System",
    ]);
  });

  it("defines 14 routes with unique hrefs", () => {
    expect(NAV_ITEMS).toHaveLength(14);
    expect(new Set(NAV_HREFS).size).toBe(14);
  });

  it("gives every item an icon and a description", () => {
    for (const item of NAV_ITEMS) {
      expect(item.icon).toBeTypeOf("object");
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("resolves the active item + section from a pathname", () => {
    const resolved = resolveActive("/health");
    expect(resolved?.item.label).toBe("Health");
    expect(resolved?.section.label).toBe("Life");
    expect(resolveActive("/unknown")).toBeNull();
  });

  it("looks items up by href", () => {
    expect(getNavItem("/today").label).toBe("Today");
    expect(() => getNavItem("/nope")).toThrow();
  });
});
