/**
 * Event Bus (Sprint 6.1). The central backbone that TRANSPORTS events and owns no business logic.
 * Pure + functional: a bus is an immutable snapshot of buffered events; publishing returns a new
 * bus. The server layer persists/drains it. Watchers publish; the Signal Engine consumes.
 */
import type { DomainEvent, EventSource } from "./types";

export interface EventBus {
  readonly events: readonly DomainEvent[];
}

/** An empty bus. */
export function createEventBus(): EventBus {
  return { events: [] };
}

/** Publish one event — returns a new bus (no mutation, no side effects). */
export function publish(bus: EventBus, event: DomainEvent): EventBus {
  return { events: [...bus.events, event] };
}

/** Publish many events at once. */
export function publishAll(bus: EventBus, events: readonly DomainEvent[]): EventBus {
  return { events: [...bus.events, ...events] };
}

/** All events from a given source. */
export function eventsFrom(bus: EventBus, source: EventSource): DomainEvent[] {
  return bus.events.filter((e) => e.source === source);
}

/** All events of a given kind. */
export function eventsOfKind(bus: EventBus, kind: string): DomainEvent[] {
  return bus.events.filter((e) => e.kind === kind);
}

/** Drain the bus (return its events + an empty bus) — the server calls this each cycle. */
export function drain(bus: EventBus): { events: DomainEvent[]; bus: EventBus } {
  return { events: [...bus.events], bus: createEventBus() };
}
