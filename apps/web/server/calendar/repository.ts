import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  availabilityWindows,
  calendarEvents,
  calendarSyncHistory,
  calendars,
  type AvailabilityWindowRow,
  type CalendarEventRow,
  type CalendarRow,
  type CalendarSyncHistoryRow,
} from "@myos/db/schema";
import type { CalendarEvent, CalendarProvider } from "@myos/core/calendar";
import { eventToColumns } from "./mapper";

/**
 * Calendar persistence (Sprint 2.7). Pure DB access over the four calendar
 * tables. No business logic — the service composes these with the pure engine.
 */
export function listCalendars(db: Database): Promise<CalendarRow[]> {
  return db.select().from(calendars).orderBy(calendars.name);
}

export async function getPrimaryCalendar(db: Database): Promise<CalendarRow | undefined> {
  const [row] = await db.select().from(calendars).where(eq(calendars.primary, true)).limit(1);
  return row;
}

/** Ensure a primary "Personal" calendar exists; returns its id. */
export async function ensurePrimary(db: Database): Promise<string> {
  const existing = await getPrimaryCalendar(db);
  if (existing) return existing.id;
  const [row] = await db
    .insert(calendars)
    .values({ name: "Personal", color: "blue", provider: "local", primary: true })
    .returning();
  return row!.id;
}

export async function toggleCalendar(
  db: Database,
  id: string,
  visible: boolean,
): Promise<CalendarRow> {
  const [row] = await db.update(calendars).set({ visible }).where(eq(calendars.id, id)).returning();
  if (!row) throw new Error("Calendar not found");
  return row;
}

export function listEvents(
  db: Database,
  range?: { from?: Date; to?: Date; calendarId?: string },
): Promise<CalendarEventRow[]> {
  const conditions = [];
  if (range?.from) conditions.push(gte(calendarEvents.endAt, range.from));
  if (range?.to) conditions.push(lte(calendarEvents.startAt, range.to));
  if (range?.calendarId) conditions.push(eq(calendarEvents.calendarId, range.calendarId));
  const where = conditions.length ? and(...conditions) : undefined;
  return db.select().from(calendarEvents).where(where).orderBy(calendarEvents.startAt);
}

export async function getEvent(db: Database, id: string): Promise<CalendarEventRow | undefined> {
  const [row] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
  return row;
}

export async function insertEvent(db: Database, event: CalendarEvent): Promise<CalendarEventRow> {
  const [row] = await db.insert(calendarEvents).values(eventToColumns(event)).returning();
  if (!row) throw new Error("Failed to insert event");
  return row;
}

export async function updateEvent(
  db: Database,
  id: string,
  event: CalendarEvent,
): Promise<CalendarEventRow> {
  const [row] = await db
    .update(calendarEvents)
    .set(eventToColumns(event))
    .where(eq(calendarEvents.id, id))
    .returning();
  if (!row) throw new Error("Failed to update event");
  return row;
}

export async function deleteEvent(db: Database, id: string): Promise<void> {
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

export function listWindows(db: Database): Promise<AvailabilityWindowRow[]> {
  return db.select().from(availabilityWindows);
}

export async function logSync(
  db: Database,
  input: {
    provider: CalendarProvider;
    status: "success" | "error";
    imported: number;
    updated: number;
    deleted: number;
    error?: string;
  },
): Promise<void> {
  await db.insert(calendarSyncHistory).values({
    provider: input.provider,
    status: input.status,
    finishedAt: new Date(),
    eventsImported: input.imported,
    eventsUpdated: input.updated,
    eventsDeleted: input.deleted,
    error: input.error ?? null,
  });
}

export function listSyncHistory(db: Database, limit = 20): Promise<CalendarSyncHistoryRow[]> {
  return db.select().from(calendarSyncHistory).orderBy(calendarSyncHistory.startedAt).limit(limit);
}

export async function markSynced(db: Database, calendarId: string): Promise<void> {
  await db.update(calendars).set({ lastSyncedAt: new Date() }).where(eq(calendars.id, calendarId));
}
