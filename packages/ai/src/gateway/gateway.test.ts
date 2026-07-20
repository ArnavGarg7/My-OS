import { describe, expect, it, vi } from "vitest";
import { AiGateway, BudgetExceededError } from "./ai-gateway";
import { classifyError, decideRetry } from "./retry";
import { failover, routeRequest } from "./provider-router";
import { ProviderRegistry } from "../providers/registry";
import type { CloudClient } from "../providers/cloud";
import type { AiRequest, TelemetryEvent } from "../schemas";

const req: AiRequest = {
  feature: "test",
  capability: "reasoning",
  messages: [{ role: "user", content: "hello" }],
};

describe("retry policy", () => {
  it("classifies errors", () => {
    expect(classifyError(new Error("rate limit hit"))).toBe("rate_limit");
    expect(classifyError(new Error("timed out"))).toBe("timeout");
    expect(classifyError(new Error("refusal"))).toBe("refusal");
    expect(classifyError(new Error("not configured"))).toBe("invalid");
  });

  it("retries retryable classes within budget, with backoff", () => {
    expect(decideRetry(new Error("rate limit"), 0).retry).toBe(true);
    expect(decideRetry(new Error("rate limit"), 0).delayMs).toBe(500);
    expect(decideRetry(new Error("rate limit"), 1).delayMs).toBe(1000);
    expect(decideRetry(new Error("rate limit"), 2).retry).toBe(false);
    expect(decideRetry(new Error("invalid schema"), 0).retry).toBe(false);
  });
});

describe("provider router", () => {
  it("routes by tier when no explicit model, falling to local when cloud unconfigured", () => {
    const reg = new ProviderRegistry();
    // best tier routes reasoning → anthropic, but anthropic unavailable → still returns the key
    const best = routeRequest(req, "best", reg);
    expect(best.modelKey).toBe("claude-opus-4-8");
    const local = routeRequest(req, "local", reg);
    expect(local.provider).toBe("local");
  });

  it("honours an explicit model", () => {
    const reg = new ProviderRegistry();
    expect(routeRequest({ ...req, model: "claude-haiku-4-5" }, "local", reg).modelKey).toBe(
      "claude-haiku-4-5",
    );
  });

  it("failover picks a different available provider or local", () => {
    const reg = new ProviderRegistry();
    const next = failover(req, "anthropic", reg);
    expect(next?.provider).toBe("local");
    expect(failover(req, "local", reg)).toBeNull();
  });
});

describe("AiGateway.run", () => {
  it("runs a request through local and records telemetry", async () => {
    const events: TelemetryEvent[] = [];
    const gw = new AiGateway({
      registry: new ProviderRegistry(),
      tier: "local",
      now: () => new Date("2026-07-18T00:00:00Z"),
    });
    const res = await gw.run(req, { recordTelemetry: (e) => events.push(e) });
    expect(res.provider).toBe("local");
    expect(res.text).toContain("hello");
    expect(events).toHaveLength(1);
    expect(events[0]!.status).toBe("ok");
    expect(events[0]!.feature).toBe("test");
  });

  it("aborts when the hard budget is exceeded", async () => {
    const gw = new AiGateway({ registry: new ProviderRegistry(), tier: "best" });
    await expect(
      gw.run({ ...req, model: "claude-opus-4-8" }, { budgetCheck: () => "hard_exceeded" }),
    ).rejects.toBeInstanceOf(BudgetExceededError);
  });

  it("retries a rate-limited provider then succeeds", async () => {
    let calls = 0;
    const flaky: CloudClient = {
      generate: async () => {
        calls += 1;
        if (calls === 1) throw new Error("rate limit exceeded");
        return {
          text: "ok",
          finishReason: "stop",
          usage: { inputTokens: 1, outputTokens: 1, cachedTokens: 0 },
        };
      },
    };
    const reg = new ProviderRegistry({ anthropic: flaky });
    const gw = new AiGateway({ registry: reg, tier: "best", sleep: async () => {} });
    const events: TelemetryEvent[] = [];
    const res = await gw.run(
      { ...req, model: "claude-opus-4-8" },
      { recordTelemetry: (e) => events.push(e) },
    );
    expect(res.text).toBe("ok");
    expect(events[0]!.retries).toBe(1);
    expect(calls).toBe(2);
  });

  it("fails over to local when a provider errors non-retryably", async () => {
    const broken: CloudClient = {
      generate: async () => {
        throw new Error("invalid request");
      },
    };
    const reg = new ProviderRegistry({ anthropic: broken });
    const gw = new AiGateway({ registry: reg, tier: "best" });
    const res = await gw.run({ ...req, model: "claude-opus-4-8" });
    expect(res.provider).toBe("local");
  });

  it("validates structured output via the injected validator", async () => {
    const gw = new AiGateway({ registry: new ProviderRegistry(), tier: "local" });
    const structured = vi.fn(() => ({ ok: true, parsed: { done: true }, repairCount: 0 }));
    const res = await gw.run({ ...req, structuredSchema: "Thing" }, { structured });
    expect(structured).toHaveBeenCalled();
    expect(res.parsed).toEqual({ done: true });
  });
});
