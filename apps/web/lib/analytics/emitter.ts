import type { MetricEvent, MetricInput, MetricKind } from "./types";

/**
 * AnalyticsEmitter (Sprint 2.8.5). Framework-free metric collector — a bounded
 * buffer plus per-kind running counts/sums, so the Analytics page can render
 * aggregates without a query round-trip. Deterministic ids (monotonic counter).
 */
export class AnalyticsEmitter {
  private listeners = new Set<(event: MetricEvent) => void>();
  private buffer: MetricEvent[] = [];
  private counts = new Map<MetricKind, { count: number; sum: number }>();
  private seq = 0;

  constructor(private readonly capacity = 500) {}

  track(input: MetricInput): MetricEvent {
    const value = input.value ?? 1;
    const event: MetricEvent = {
      id: `m_${++this.seq}`,
      kind: input.kind,
      value,
      at: input.at ?? new Date().toISOString(),
      ...(input.meta !== undefined ? { meta: input.meta } : {}),
    };
    this.buffer.push(event);
    if (this.buffer.length > this.capacity) this.buffer.shift();
    const agg = this.counts.get(input.kind) ?? { count: 0, sum: 0 };
    agg.count += 1;
    agg.sum += value;
    this.counts.set(input.kind, agg);
    for (const listener of this.listeners) listener(event);
    return event;
  }

  subscribe(listener: (event: MetricEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Running count for a metric kind. */
  count(kind: MetricKind): number {
    return this.counts.get(kind)?.count ?? 0;
  }

  /** Mean value for a metric kind (0 when never tracked) — e.g. planner accuracy. */
  average(kind: MetricKind): number {
    const agg = this.counts.get(kind);
    if (!agg || agg.count === 0) return 0;
    return agg.sum / agg.count;
  }

  recent(limit = 50): MetricEvent[] {
    return this.buffer.slice(-limit).reverse();
  }

  clear(): void {
    this.buffer = [];
    this.counts.clear();
  }
}
