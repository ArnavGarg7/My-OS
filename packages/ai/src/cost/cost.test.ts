import { describe, expect, it } from "vitest";
import { guardCost, summarizeSpend } from "./index";
import { BUDGET } from "../config/costs";
import type { TelemetryEvent } from "../schemas";

function ev(costUsd: number, feature = "assistant", provider = "anthropic"): TelemetryEvent {
  return {
    requestId: "r",
    feature,
    provider,
    model: "m",
    promptVersion: null,
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    latencyMs: 0,
    retries: 0,
    repairCount: 0,
    toolCalls: 0,
    toolTimeMs: 0,
    costUsd,
    status: "ok",
  };
}

describe("summarizeSpend", () => {
  it("sums total and per-feature/provider spend", () => {
    const s = summarizeSpend([ev(0.5, "assistant"), ev(0.25, "planner"), ev(0.25, "assistant")]);
    expect(s.totalUsd).toBe(1);
    expect(s.byFeature.assistant).toBe(0.75);
    expect(s.byProvider.anthropic).toBe(1);
  });
});

describe("guardCost", () => {
  it("allows below the soft cap", () => {
    const g = guardCost(0);
    expect(g.verdict).toBe("ok");
    expect(g.interactive).toBe("allow");
  });

  it("asks confirmation / downgrades at the soft cap", () => {
    const g = guardCost(BUDGET.softDailyUsd);
    expect(g.interactive).toBe("confirm");
    expect(g.background).toBe("downgrade");
  });

  it("blocks both at the hard cap", () => {
    const g = guardCost(BUDGET.hardDailyUsd);
    expect(g.interactive).toBe("block");
    expect(g.background).toBe("block");
  });
});
