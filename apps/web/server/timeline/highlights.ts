import "server-only";
import {
  timelineEngine,
  type SnapshotType,
  type TimelineHighlight,
  type TimelineSnapshot,
} from "@myos/core/timeline";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { eventRowToEvent } from "./mapper";

/**
 * Timeline highlights + snapshots service (Sprint 2.13). Both are pure period
 * aggregations derived on read from the stored events — no narrative generation.
 */
export async function highlights(
  db: Database,
  opts: { from?: string | undefined; to?: string | undefined } = {},
): Promise<TimelineHighlight[]> {
  const rows = await repo.allEvents(db);
  let events = rows.map(eventRowToEvent);
  if (opts.from || opts.to) {
    events = timelineEngine.feed(events, {
      ...(opts.from ? { from: opts.from } : {}),
      ...(opts.to ? { to: opts.to } : {}),
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  return timelineEngine.highlights(events, today);
}

export async function snapshot(
  db: Database,
  type: SnapshotType,
  date: string,
): Promise<TimelineSnapshot> {
  const rows = await repo.allEvents(db);
  return timelineEngine.snapshot(rows.map(eventRowToEvent), type, date);
}

export async function snapshots(db: Database, date: string): Promise<TimelineSnapshot[]> {
  const rows = await repo.allEvents(db);
  return timelineEngine.snapshots(rows.map(eventRowToEvent), date);
}
