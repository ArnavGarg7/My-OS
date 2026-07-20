import { describe, expect, it } from "vitest";
import { getModel, modelsForCapability, MODELS } from "./models";
import { CAPABILITIES, TIER_ROUTES, isCapability } from "./capabilities";
import { BUDGET, classifyBudget, computeCost, roundUsd } from "./costs";
import { DEFAULTS } from "./defaults";

describe("config/models", () => {
  it("resolves known models and null for unknown", () => {
    expect(getModel("claude-opus-4-8")?.provider).toBe("anthropic");
    expect(getModel("local-deterministic")?.provider).toBe("local");
    expect(getModel("nope")).toBeNull();
  });

  it("every model has a non-empty, unique runtime id", () => {
    const ids = Object.values(MODELS).map((m) => m.id);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("orders capability models cheapest-input first", () => {
    const reasoning = modelsForCapability("reasoning");
    expect(reasoning.length).toBeGreaterThan(0);
    for (let i = 1; i < reasoning.length; i += 1) {
      expect(reasoning[i]!.inputCostPerMTok).toBeGreaterThanOrEqual(
        reasoning[i - 1]!.inputCostPerMTok,
      );
    }
  });
});

describe("config/capabilities", () => {
  it("recognises valid capabilities", () => {
    expect(isCapability("reasoning")).toBe(true);
    expect(isCapability("telepathy")).toBe(false);
  });

  it("every tier route points at a real model", () => {
    for (const routes of Object.values(TIER_ROUTES)) {
      for (const modelKey of Object.values(routes)) {
        if (modelKey) expect(getModel(modelKey)).not.toBeNull();
      }
    }
  });

  it("local tier routes every capability to the local model", () => {
    for (const cap of CAPABILITIES) {
      if (TIER_ROUTES.local[cap]) expect(TIER_ROUTES.local[cap]).toBe("local-deterministic");
    }
  });
});

describe("config/costs", () => {
  it("computes cost from tokens deterministically", () => {
    expect(computeCost("claude-opus-4-8", 1_000_000, 0)).toBe(5);
    expect(computeCost("claude-opus-4-8", 0, 1_000_000)).toBe(25);
    expect(computeCost("local-deterministic", 1_000_000, 1_000_000)).toBe(0);
    expect(computeCost("unknown", 999, 999)).toBe(0);
  });

  it("classifies budget verdicts", () => {
    expect(classifyBudget(0)).toBe("ok");
    expect(classifyBudget(BUDGET.softDailyUsd)).toBe("soft_exceeded");
    expect(classifyBudget(BUDGET.hardDailyUsd)).toBe("hard_exceeded");
  });

  it("rounds to sub-cent", () => {
    expect(roundUsd(0.123456789)).toBe(0.123457);
  });
});

describe("config/defaults", () => {
  it("has the 8k context budget from the architecture", () => {
    expect(DEFAULTS.contextTokenBudget).toBe(8_000);
    expect(DEFAULTS.maxAgentIterations).toBe(8);
  });
});
