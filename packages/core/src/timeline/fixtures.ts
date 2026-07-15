import type { TimelineSource } from "./constants";
import { importanceFor } from "./aggregator";
import type { TimelineEvent } from "./types";

/** Test fixtures for the timeline engine (imported by *.test.ts). */
export const at = (y: number, mo: number, d: number, h = 12, mi = 0) =>
  new Date(Date.UTC(y, mo, d, h, mi, 0)).toISOString();
export const day = (y: number, mo: number, d: number) =>
  new Date(Date.UTC(y, mo, d)).toISOString().slice(0, 10);

let seq = 0;
export function resetSeq(): void {
  seq = 0;
}

export function makeEvent(over: Partial<TimelineEvent> = {}): TimelineEvent {
  const eventType = over.eventType ?? "task.completed";
  const source: TimelineSource = over.source ?? "task";
  return {
    id: over.id ?? `tl_${++seq}`,
    eventType,
    source,
    entityId: over.entityId ?? null,
    title: over.title ?? "Did a thing",
    summary: over.summary ?? over.title ?? "Did a thing",
    timestamp: over.timestamp ?? at(2026, 6, 1),
    importance: over.importance ?? importanceFor(eventType),
    metadata: over.metadata ?? {},
  };
}

/** A small mixed stream spanning several days + sources. */
export function makeStream(): TimelineEvent[] {
  return [
    makeEvent({
      id: "a",
      eventType: "goal.completed",
      source: "goal",
      title: "Shipped v1",
      timestamp: at(2026, 6, 3, 9),
    }),
    makeEvent({
      id: "b",
      eventType: "task.completed",
      source: "task",
      title: "Wrote tests",
      timestamp: at(2026, 6, 3, 11),
      metadata: { focusMinutes: 90 },
    }),
    makeEvent({
      id: "c",
      eventType: "journal.created",
      source: "journal",
      title: "Morning pages",
      timestamp: at(2026, 6, 2, 8),
    }),
    makeEvent({
      id: "d",
      eventType: "finance.transaction",
      source: "finance",
      title: "Groceries",
      timestamp: at(2026, 6, 2, 18),
      metadata: { amount: 1200, direction: "expense" },
    }),
    makeEvent({
      id: "e",
      eventType: "habit.completed",
      source: "goal",
      title: "Meditated",
      timestamp: at(2026, 6, 1, 7),
    }),
  ];
}
