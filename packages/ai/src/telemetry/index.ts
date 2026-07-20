/**
 * AI Telemetry (Sprint 5.1, 06_AI_Architecture §Telemetry). Captures every AI interaction with a
 * stable field set (provider, model, prompt version, tokens, latency, retries, repairs, tool calls,
 * cost, status). The collector here is an in-memory sink + aggregator that the gateway feeds and a
 * dashboard reads; the server persists events to `ai_usage_log`. Pure — no IO.
 */
import { telemetryEventSchema, type TelemetryEvent } from "../schemas";

export interface TelemetryAggregate {
  count: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  totalCostUsd: number;
  totalRetries: number;
  totalRepairs: number;
  errors: number;
  refusals: number;
  avgLatencyMs: number;
  byProvider: Record<string, number>;
  byFeature: Record<string, number>;
  byModel: Record<string, number>;
}

/** In-memory collector — records validated events and aggregates them on demand. */
export class TelemetryCollector {
  private readonly events: TelemetryEvent[] = [];

  record(event: TelemetryEvent): void {
    this.events.push(telemetryEventSchema.parse(event));
  }

  all(): readonly TelemetryEvent[] {
    return this.events;
  }

  clear(): void {
    this.events.length = 0;
  }

  aggregate(): TelemetryAggregate {
    return aggregateEvents(this.events);
  }
}

/** Pure aggregation over a list of events. */
export function aggregateEvents(events: readonly TelemetryEvent[]): TelemetryAggregate {
  const agg: TelemetryAggregate = {
    count: events.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCachedTokens: 0,
    totalCostUsd: 0,
    totalRetries: 0,
    totalRepairs: 0,
    errors: 0,
    refusals: 0,
    avgLatencyMs: 0,
    byProvider: {},
    byFeature: {},
    byModel: {},
  };
  let latencySum = 0;
  for (const e of events) {
    agg.totalInputTokens += e.inputTokens;
    agg.totalOutputTokens += e.outputTokens;
    agg.totalCachedTokens += e.cachedTokens;
    agg.totalCostUsd += e.costUsd;
    agg.totalRetries += e.retries;
    agg.totalRepairs += e.repairCount;
    if (e.status === "error") agg.errors += 1;
    if (e.status === "refusal") agg.refusals += 1;
    latencySum += e.latencyMs;
    agg.byProvider[e.provider] = (agg.byProvider[e.provider] ?? 0) + 1;
    agg.byFeature[e.feature] = (agg.byFeature[e.feature] ?? 0) + 1;
    agg.byModel[e.model] = (agg.byModel[e.model] ?? 0) + 1;
  }
  agg.totalCostUsd = Math.round(agg.totalCostUsd * 1_000_000) / 1_000_000;
  agg.avgLatencyMs = events.length ? Math.round(latencySum / events.length) : 0;
  return agg;
}

export type { TelemetryEvent };
