import { describe, expect, it } from "vitest";
import { parseCapture } from "./parser";

describe("parser", () => {
  it("extracts tags", () => {
    const p = parseCapture("Great session today #work #focus");
    expect(p.tags).toEqual(["work", "focus"]);
  });

  it("extracts a mood directive and strips it from content", () => {
    const p = parseCapture("Rough morning /mood low");
    expect(p.mood).toBe("low");
    expect(p.content).not.toContain("/mood");
  });

  it("maps mood synonyms", () => {
    expect(parseCapture("x /mood amazing").mood).toBe("excellent");
    expect(parseCapture("x /mood okay").mood).toBe("neutral");
  });

  it("derives a title from the first sentence", () => {
    const p = parseCapture("Shipped the feature. Then celebrated.");
    expect(p.title).toBe("Shipped the feature");
  });

  it("truncates a long title", () => {
    const p = parseCapture("x".repeat(120));
    expect(p.title.endsWith("…")).toBe(true);
    expect(p.title.length).toBeLessThanOrEqual(80);
  });

  it("classifies a gratitude entry from its tag", () => {
    expect(parseCapture("thankful for family #gratitude").entryType).toBe("gratitude");
  });

  it("classifies an idea entry from its tag", () => {
    expect(parseCapture("build a thing #idea").entryType).toBe("idea");
  });

  it("falls back to Untitled when only a directive is given", () => {
    const p = parseCapture("/mood good");
    expect(p.entryType).toBe("daily");
    expect(p.title).toBe("Untitled");
  });
});
