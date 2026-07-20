import { describe, expect, it } from "vitest";
import { TelemetryCollector, aggregateEvents } from "./index";
import type { TelemetryEvent } from "../schemas";

function ev(over: Partial<TelemetryEvent> = {}): TelemetryEvent {
  return {
    requestId: "r1",
    feature: "assistant",
    provider: "local",
    model: "local-deterministic",
    promptVersion: null,
    inputTokens: 10,
    outputTokens: 5,
    cachedTokens: 0,
    latencyMs: 20,
    retries: 0,
    repairCount: 0,
    toolCalls: 0,
    toolTimeMs: 0,
    costUsd: 0,
    status: "ok",
    ...over,
  };
}

describe("TelemetryCollector", () => {
  it("records validated events and clears", () => {
    const c = new TelemetryCollector();
    c.record(ev());
    c.record(ev({ status: "error" }));
    expect(c.all()).toHaveLength(2);
    c.clear();
    expect(c.all()).toHaveLength(0);
  });

  it("aggregates counts, tokens, errors and averages", () => {
    const agg = aggregateEvents([
      ev({ latencyMs: 10 }),
      ev({ latencyMs: 30, status: "error", provider: "anthropic", retries: 2 }),
    ]);
    expect(agg.count).toBe(2);
    expect(agg.totalInputTokens).toBe(20);
    expect(agg.errors).toBe(1);
    expect(agg.avgLatencyMs).toBe(20);
    expect(agg.totalRetries).toBe(2);
    expect(agg.byProvider.anthropic).toBe(1);
    expect(agg.byFeature.assistant).toBe(2);
  });
});
