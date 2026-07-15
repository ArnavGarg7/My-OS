import type { TimelineEvent, TimelineInput } from "./types";

/**
 * TimelineEmitter (Sprint 2.8.5). A tiny, framework-free pub/sub with a bounded
 * ring buffer of recent events. Deterministic: ids are a monotonic counter so
 * tests don't depend on randomness. The provider wraps a single instance.
 */
export class TimelineEmitter {
  private listeners = new Set<(event: TimelineEvent) => void>();
  private buffer: TimelineEvent[] = [];
  private seq = 0;

  constructor(private readonly capacity = 200) {}

  emit(input: TimelineInput): TimelineEvent {
    const event: TimelineEvent = {
      id: `tl_${++this.seq}`,
      at: input.at ?? new Date().toISOString(),
      kind: input.kind,
      source: input.source,
      title: input.title,
      ...(input.meta !== undefined ? { meta: input.meta } : {}),
    };
    this.buffer.push(event);
    if (this.buffer.length > this.capacity) this.buffer.shift();
    for (const listener of this.listeners) listener(event);
    return event;
  }

  subscribe(listener: (event: TimelineEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Most-recent-first snapshot of the buffered events. */
  recent(limit = 50): TimelineEvent[] {
    return this.buffer.slice(-limit).reverse();
  }

  clear(): void {
    this.buffer = [];
  }
}
