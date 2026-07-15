import { describe, expect, it } from "vitest";
import { checklistProgress, defaultChecklist, toggleItem } from "./checklist";

describe("defaultChecklist", () => {
  it("seeds the template with unique ids", () => {
    const items = defaultChecklist();
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(items.some((i) => i.required)).toBe(true);
  });
});

describe("checklistProgress", () => {
  it("tracks completion + required-remaining", () => {
    const items = defaultChecklist();
    const p0 = checklistProgress(items);
    expect(p0.completed).toBe(0);
    expect(p0.allRequiredDone).toBe(false);
    expect(p0.requiredRemaining).toBeGreaterThan(0);
  });
  it("reports all-required-done once required items complete", () => {
    let items = defaultChecklist().map((i) => (i.required ? { ...i, completed: true } : i));
    const p = checklistProgress(items);
    expect(p.allRequiredDone).toBe(true);
    expect(p.requiredRemaining).toBe(0);
    // toggling keeps determinism
    items = toggleItem(items, items[0]!.id, false);
    expect(checklistProgress(items).allRequiredDone).toBe(items[0]!.required ? false : true);
  });
  it("computes percent", () => {
    const items = defaultChecklist().map((i, idx) => (idx < 4 ? { ...i, completed: true } : i));
    expect(checklistProgress(items).percent).toBe(50); // 4 of 8
  });
  it("is 100% when all complete", () => {
    const items = defaultChecklist().map((i) => ({ ...i, completed: true }));
    const p = checklistProgress(items);
    expect(p.percent).toBe(100);
    expect(p.allRequiredDone).toBe(true);
  });
  it("is empty-safe", () => {
    const p = checklistProgress([]);
    expect(p.percent).toBe(0);
    expect(p.allRequiredDone).toBe(true);
  });
});

describe("toggleItem", () => {
  it("flips only the target item", () => {
    const items = defaultChecklist();
    const toggled = toggleItem(items, items[2]!.id, true);
    expect(toggled[2]!.completed).toBe(true);
    expect(toggled[0]!.completed).toBe(false);
  });
  it("leaves items unchanged for an unknown id", () => {
    const items = defaultChecklist();
    expect(toggleItem(items, "nope", true)).toEqual(items);
  });
});
