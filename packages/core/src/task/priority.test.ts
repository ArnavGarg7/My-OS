import { describe, expect, it } from "vitest";
import { comparePriority, parsePriority } from "./priority";

describe("comparePriority", () => {
  it("orders urgent > high > medium > low", () => {
    const sorted = ["low", "urgent", "medium", "high"].sort((a, b) =>
      comparePriority(a as never, b as never),
    );
    expect(sorted).toEqual(["urgent", "high", "medium", "low"]);
  });
});

describe("parsePriority", () => {
  it("detects urgent from urgent/asap/!!!", () => {
    expect(parsePriority("do this asap")).toBe("urgent");
    expect(parsePriority("URGENT fix")).toBe("urgent");
    expect(parsePriority("ship it!!!")).toBe("urgent");
  });

  it("detects high from important / high", () => {
    expect(parsePriority("important meeting")).toBe("high");
    expect(parsePriority("high priority task")).toBe("high");
    expect(parsePriority("high energy plan")).toBe("high");
  });

  it("detects low from low priority / someday", () => {
    expect(parsePriority("someday maybe")).toBe("low");
    expect(parsePriority("low priority cleanup")).toBe("low");
  });

  it("returns null when nothing matches", () => {
    expect(parsePriority("buy milk")).toBeNull();
  });
});
