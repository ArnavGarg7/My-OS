import "server-only";
import { memoryTypeFor, type TimelineMemory } from "@myos/core/timeline";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { eventRowToEvent, memoryRowToMemory } from "./mapper";

/**
 * Timeline memory service (Sprint 2.13). Lists pinned memories and pins/unpins
 * an event as a memory. Memory type is derived deterministically from the event
 * (rule-based, not learned). Pinning is idempotent per event.
 */
export async function list(db: Database): Promise<TimelineMemory[]> {
  const rows = await repo.listMemories(db);
  const events = await repo.eventsByIds(
    db,
    rows.map((r) => r.eventId),
  );
  const byId = new Map(events.map((e) => [e.id, e]));
  return rows
    .map((r) => {
      const event = byId.get(r.eventId);
      return event ? memoryRowToMemory(r, event) : null;
    })
    .filter((m): m is TimelineMemory => m !== null);
}

export async function pin(db: Database, eventId: string): Promise<TimelineMemory> {
  const eventRow = await repo.getEvent(db, eventId);
  if (!eventRow) throw new Error("Event not found");
  const existing = await repo.getMemoryByEvent(db, eventId);
  if (existing) return memoryRowToMemory(existing, eventRow);

  const event = eventRowToEvent(eventRow);
  const row = await repo.insertMemory(db, {
    eventId,
    memoryType: memoryTypeFor(event),
    title: event.title,
    description: event.summary,
    pinned: true,
  });
  return memoryRowToMemory(row, eventRow);
}

export async function unpin(db: Database, id: string): Promise<{ ok: true }> {
  await repo.deleteMemory(db, id);
  return { ok: true };
}
