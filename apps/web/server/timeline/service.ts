import "server-only";
import {
  importanceFor,
  timelineEngine,
  type FeedInput,
  type Grouping,
  type RecordEventInput,
  type TimelineEvent,
  type TimelineFilter,
} from "@myos/core/timeline";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { eventRowToEvent } from "./mapper";

/**
 * TimelineService (Sprint 2.13). Bridges the pure TimelineEngine with the
 * append-only store. `record` is the single ingestion path (every module's
 * emitter flows through it); every read derives its view from stored events.
 */
export async function record(db: Database, input: RecordEventInput): Promise<TimelineEvent> {
  const row = await repo.insertEvent(db, {
    eventType: input.eventType,
    sourceModule: input.source,
    entityId: input.entityId ?? null,
    title: input.title,
    summary: input.summary ?? input.title,
    timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
    importance: importanceFor(input.eventType, input.importance),
    metadata: input.metadata ?? {},
  });
  return eventRowToEvent(row);
}

function filterFrom(input: FeedInput): TimelineFilter {
  return {
    ...(input.sources ? { sources: input.sources } : {}),
    ...(input.eventTypes ? { eventTypes: input.eventTypes } : {}),
    ...(typeof input.minImportance === "number" ? { minImportance: input.minImportance } : {}),
    ...(input.from ? { from: input.from } : {}),
    ...(input.to ? { to: input.to } : {}),
  };
}

/** The chronological feed — optionally grouped — as flat events + groups. */
export async function feed(db: Database, input: FeedInput) {
  const limit = input.limit ?? 200;
  const rows = await repo.listEvents(db, {
    ...(input.from ? { from: new Date(lower(input.from)) } : {}),
    ...(input.to ? { to: new Date(upper(input.to)) } : {}),
    limit,
  });
  const events = rows.map(eventRowToEvent);
  const filter = filterFrom(input);
  const filtered = timelineEngine.feed(events, filter);
  const grouping: Grouping = input.grouping ?? "day";
  return {
    events: filtered,
    groups: timelineEngine.group(events, grouping, filter),
    grouping,
  };
}

export async function day(db: Database, date: string) {
  const rows = await repo.listEvents(db, {
    from: new Date(`${date}T00:00:00.000Z`),
    to: new Date(`${date}T23:59:59.999Z`),
    limit: 500,
  });
  return timelineEngine.day(rows.map(eventRowToEvent), date);
}

export async function search(db: Database, query: string): Promise<TimelineEvent[]> {
  const rows = await repo.allEvents(db);
  return timelineEngine.search(rows.map(eventRowToEvent), query);
}

export async function statistics(db: Database) {
  const rows = await repo.allEvents(db);
  return timelineEngine.statistics(rows.map(eventRowToEvent));
}

/** Status-bar counts: today's event count + the latest event timestamp. */
export async function counts(db: Database, date: string) {
  const rows = await repo.listEvents(db, {
    from: new Date(`${date}T00:00:00.000Z`),
    to: new Date(`${date}T23:59:59.999Z`),
    limit: 500,
  });
  const [latest] = await repo.listEvents(db, { limit: 1 });
  return {
    todayCount: rows.length,
    latestAt: latest ? latest.timestamp.toISOString() : null,
  };
}

function lower(v: string): string {
  return v.length === 10 ? `${v}T00:00:00.000Z` : v;
}
function upper(v: string): string {
  return v.length === 10 ? `${v}T23:59:59.999Z` : v;
}
