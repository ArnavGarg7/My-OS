import { describe, expect, it } from "vitest";
import {
  AI_SAFE_SURFACES,
  DOMAIN_CLASSIFICATION,
  classifyTable,
  isAiSafeSurface,
  isAtLeast,
} from "./classification";

describe("data classification registry", () => {
  it("classifies every domain with a rationale", () => {
    for (const d of DOMAIN_CLASSIFICATION) {
      expect(d.file).toMatch(/\.ts$/);
      expect(d.rationale.length).toBeGreaterThan(10);
    }
  });

  it("never marks free-text/PII domains as raw-AI-safe", () => {
    const private_ = DOMAIN_CLASSIFICATION.filter((d) => d.level === "private");
    expect(private_.length).toBeGreaterThan(0);
    for (const d of private_) expect(d.rawAiSafe).toBe(false);
  });

  it("applies table overrides above the domain default", () => {
    // journal defaults to private; task.tasks is overridden up to private.
    expect(classifyTable("task.ts", "tasks")).toBe("private");
    expect(classifyTable("task.ts", "task_labels")).toBe("sensitive");
    expect(classifyTable("unknown.ts", "x")).toBeNull();
  });

  it("orders sensitivity correctly", () => {
    expect(isAtLeast("private", "sensitive")).toBe(true);
    expect(isAtLeast("internal", "sensitive")).toBe(false);
  });

  it("recognises only derived read models as AI-safe surfaces", () => {
    expect(isAiSafeSurface("summary")).toBe(true);
    expect(isAiSafeSurface("dashboard")).toBe(true);
    expect(isAiSafeSurface("list")).toBe(false);
    expect(isAiSafeSurface("create")).toBe(false);
    expect(AI_SAFE_SURFACES).not.toContain("create");
  });
});
