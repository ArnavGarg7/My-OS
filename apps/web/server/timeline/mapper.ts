import "server-only";
import type {
  MemoryType,
  TimelineEvent,
  TimelineMemory,
  TimelineSnapshot,
  TimelineSource,
} from "@myos/core/timeline";
import type { TimelineEventRow, TimelineMemoryRow, TimelineSnapshotRow } from "@myos/db/schema";

/**
 * Timeline row ↔ DTO mapping (Sprint 2.13). Timestamps become ISO strings for
 * the pure engine + client. The DB is the immutable store; the engine derives
 * every view from these events.
 */
export function eventRowToEvent(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    eventType: row.eventType,
    source: row.sourceModule as TimelineSource,
    entityId: row.entityId,
    title: row.title,
    summary: row.summary,
    timestamp: row.timestamp.toISOString(),
    importance: row.importance,
    metadata: row.metadata,
  };
}

export function memoryRowToMemory(row: TimelineMemoryRow, event: TimelineEventRow): TimelineMemory {
  return {
    id: row.id,
    eventId: row.eventId,
    memoryType: row.memoryType as MemoryType,
    title: row.title,
    description: row.description,
    pinned: row.pinned,
    at: event.timestamp.toISOString(),
  };
}

export function snapshotRowToSnapshot(row: TimelineSnapshotRow): TimelineSnapshot {
  return {
    snapshotType: row.snapshotType,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    summary: row.summary,
    metadata: row.metadata as TimelineSnapshot["metadata"],
  };
}
