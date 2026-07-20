import { describe, expect, it } from "vitest";
import { getPrompt, isModelCompatible, listPrompts } from "./registry";

describe("prompt registry", () => {
  it("lists registered prompts with valid metadata", () => {
    const all = listPrompts();
    expect(all.length).toBeGreaterThanOrEqual(5);
    expect(all.find((p) => p.name === "system.assistant")).toBeDefined();
    for (const p of all) expect(p.owner).toBe("platform");
  });

  it("resolves by name (latest version) and by explicit version", () => {
    expect(getPrompt("planner.generate")?.metadata.outputSchema).toBe("DayPlanDraft");
    expect(getPrompt("planner.generate", "1")).not.toBeNull();
    expect(getPrompt("nope")).toBeNull();
  });

  it("system prompt is prefix-stable (no timestamps/interpolation markers)", () => {
    const asset = getPrompt("system.assistant");
    expect(asset?.template).not.toMatch(/\$\{|\{\{|\d{4}-\d{2}-\d{2}/);
  });

  it("checks model compatibility", () => {
    expect(isModelCompatible("system.assistant", "claude-opus-4-8")).toBe(true);
    expect(isModelCompatible("system.assistant", "gpt-4")).toBe(false);
  });
});
