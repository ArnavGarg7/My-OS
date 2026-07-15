import {
  DEFAULT_MEMORY_TYPE,
  MEMORY_PROMOTION_THRESHOLD,
  MEMORY_TYPE_BY_EVENT,
  type MemoryType,
} from "./constants";
import { aggregate } from "./aggregator";
import type { TimelineEvent, TimelineMemory } from "./types";

/**
 * Memory engine (Sprint 2.13). Rule-based promotion of important events into
 * memories — deterministic, not learned. An event is memorable when its type
 * has an explicit promotion rule OR its importance clears the threshold.
 * Memory ids are derived from the event id so promotion is reproducible.
 */

export function memoryTypeFor(event: TimelineEvent): MemoryType {
  return MEMORY_TYPE_BY_EVENT[event.eventType] ?? DEFAULT_MEMORY_TYPE;
}

export function isMemorable(event: TimelineEvent): boolean {
  return event.eventType in MEMORY_TYPE_BY_EVENT || event.importance >= MEMORY_PROMOTION_THRESHOLD;
}

/** A memory derived from a single event (deterministic id `mem_<eventId>`). */
export function toMemory(event: TimelineEvent, pinned = false): TimelineMemory {
  return {
    id: `mem_${event.id}`,
    eventId: event.id,
    memoryType: memoryTypeFor(event),
    title: event.title,
    description: event.summary,
    pinned,
    at: event.timestamp,
  };
}

/** Every event that qualifies as a memory, newest first. */
export function promoteMemories(events: TimelineEvent[]): TimelineMemory[] {
  return aggregate(events)
    .filter(isMemorable)
    .map((e) => toMemory(e));
}
