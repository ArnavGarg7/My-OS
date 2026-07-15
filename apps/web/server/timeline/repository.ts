import "server-only";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  timelineEvents,
  timelineMemories,
  timelineSnapshots,
  type TimelineEventInsertRow,
  type TimelineEventRow,
  type TimelineMemoryRow,
  type TimelineSnapshotRow,
} from "@myos/db/schema";

/**
 * Timeline persistence (Sprint 2.13). Append-only over `timeline_events` — no
 * update/delete of events (immutable history). Memories + snapshots are the only
 * mutable, derived tables. Reads are time-bounded for the feed.
 */
export async function insertEvent(
  db: Database,
  values: TimelineEventInsertRow,
): Promise<TimelineEventRow> {
  const [row] = await db.insert(timelineEvents).values(values).returning();
  if (!row) throw new Error("Failed to insert timeline event");
  return row;
}

export async function getEvent(db: Database, id: string): Promise<TimelineEventRow | undefined> {
  const [row] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id)).limit(1);
  return row;
}

/** Recent events, newest first, optionally bounded by an inclusive date range. */
export function listEvents(
  db: Database,
  opts: { from?: Date; to?: Date; limit: number },
): Promise<TimelineEventRow[]> {
  const clauses = [];
  if (opts.from) clauses.push(gte(timelineEvents.timestamp, opts.from));
  if (opts.to) clauses.push(lte(timelineEvents.timestamp, opts.to));
  const where = clauses.length ? and(...clauses) : undefined;
  return db
    .select()
    .from(timelineEvents)
    .where(where)
    .orderBy(desc(timelineEvents.timestamp))
    .limit(opts.limit);
}

/** All events (bounded high) — the engine derives snapshots/highlights/memories. */
export function allEvents(db: Database, limit = 5000): Promise<TimelineEventRow[]> {
  return db.select().from(timelineEvents).orderBy(desc(timelineEvents.timestamp)).limit(limit);
}

export function eventsByIds(db: Database, ids: string[]): Promise<TimelineEventRow[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db.select().from(timelineEvents).where(inArray(timelineEvents.id, ids));
}

// --- memories ---
export function listMemories(db: Database): Promise<TimelineMemoryRow[]> {
  return db.select().from(timelineMemories).orderBy(desc(timelineMemories.createdAt));
}

export async function getMemoryByEvent(
  db: Database,
  eventId: string,
): Promise<TimelineMemoryRow | undefined> {
  const [row] = await db
    .select()
    .from(timelineMemories)
    .where(eq(timelineMemories.eventId, eventId))
    .limit(1);
  return row;
}

export async function insertMemory(
  db: Database,
  values: {
    eventId: string;
    memoryType: TimelineMemoryRow["memoryType"];
    title: string;
    description: string;
    pinned: boolean;
  },
): Promise<TimelineMemoryRow> {
  const [row] = await db.insert(timelineMemories).values(values).returning();
  if (!row) throw new Error("Failed to insert memory");
  return row;
}

export async function deleteMemory(db: Database, id: string): Promise<void> {
  await db.delete(timelineMemories).where(eq(timelineMemories.id, id));
}

// --- snapshots ---
export function listSnapshots(db: Database): Promise<TimelineSnapshotRow[]> {
  return db.select().from(timelineSnapshots).orderBy(desc(timelineSnapshots.periodStart));
}
