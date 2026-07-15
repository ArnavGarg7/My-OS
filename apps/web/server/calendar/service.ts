import "server-only";
import {
  calendarEngine,
  exportIcs,
  importIcs,
  type AvailabilityWindow,
  type Calendar,
  type CalendarConflict,
  type CalendarEvent,
  type CalendarProvider,
  type CalendarSummary,
  type CreateEventInput,
  type FreeBusy,
  type Interval,
  type SyncResult,
  type UpdateEventInput,
} from "@myos/core/calendar";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import * as plannerRepo from "../planner/repository";
import { blockRowToBlock } from "../planner/mapper";
import * as repo from "./repository";
import { runSync, AVAILABLE_PROVIDERS } from "./sync";
import { calendarRowToCalendar, eventRowToEvent, windowRowToWindow } from "./mapper";

/**
 * CalendarService (Sprint 2.7). Bridges the pure CalendarEngine with persistence
 * and provider sync. The single source of truth for time; the Planner consumes
 * its free/busy output.
 */
interface CalPrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

function dayRange(date: string): { fromIso: string; toIso: string; from: Date; to: Date } {
  const from = new Date(`${date}T00:00:00`);
  const to = new Date(from.getTime() + 24 * 60 * 60_000);
  return { fromIso: from.toISOString(), toIso: to.toISOString(), from, to };
}

/** Windows for a date — synthesize a working window from prefs when none exist. */
async function effectiveWindows(
  db: Database,
  prefs: CalPrefs,
  date: string,
): Promise<AvailabilityWindow[]> {
  const stored = (await repo.listWindows(db)).map(windowRowToWindow);
  if (stored.length > 0) return stored;
  const weekday = new Date(`${date}T00:00:00`).getDay();
  return [
    {
      id: "synthetic",
      weekday,
      startTime: prefs.preferredStartOfDay,
      endTime: prefs.preferredEndOfDay,
      type: "working",
    },
  ];
}

async function expandedDay(db: Database, date: string): Promise<CalendarEvent[]> {
  const { from, to, fromIso, toIso } = dayRange(date);
  const events = (await repo.listEvents(db, { from, to })).map(eventRowToEvent);
  return calendarEngine.expand(events, fromIso, toIso);
}

export async function list(
  db: Database,
  input: { from?: string | undefined; to?: string | undefined; calendarId?: string | undefined },
): Promise<CalendarEvent[]> {
  const from = input.from ? new Date(input.from) : undefined;
  const to = input.to ? new Date(input.to) : undefined;
  const rows = await repo.listEvents(db, {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(input.calendarId ? { calendarId: input.calendarId } : {}),
  });
  const events = rows.map(eventRowToEvent);
  if (input.from && input.to) return calendarEngine.expand(events, input.from, input.to);
  return events;
}

export async function get(db: Database, id: string): Promise<CalendarEvent> {
  const row = await repo.getEvent(db, id);
  if (!row) throw new Error("Event not found");
  return eventRowToEvent(row);
}

export async function create(db: Database, input: CreateEventInput): Promise<CalendarEvent> {
  const calendarId = input.calendarId ?? (await repo.ensurePrimary(db));
  const now = new Date().toISOString();
  const event: CalendarEvent = {
    id: "",
    title: input.title,
    description: input.description ?? "",
    calendarId,
    location: input.location ?? "",
    startAt: input.startAt,
    endAt: input.endAt,
    timezone: input.timezone ?? "UTC",
    allDay: input.allDay ?? false,
    status: input.status ?? "confirmed",
    source: "local",
    recurrenceRule: input.recurrenceRule ?? null,
    recurrenceParent: null,
    createdAt: now,
    updatedAt: now,
  };
  return eventRowToEvent(await repo.insertEvent(db, event));
}

export async function update(db: Database, input: UpdateEventInput): Promise<CalendarEvent> {
  const row = await repo.getEvent(db, input.id);
  if (!row) throw new Error("Event not found");
  const current = eventRowToEvent(row);
  const next: CalendarEvent = {
    ...current,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.startAt !== undefined ? { startAt: input.startAt } : {}),
    ...(input.endAt !== undefined ? { endAt: input.endAt } : {}),
    ...(input.allDay !== undefined ? { allDay: input.allDay } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.recurrenceRule !== undefined ? { recurrenceRule: input.recurrenceRule } : {}),
    updatedAt: new Date().toISOString(),
  };
  return eventRowToEvent(await repo.updateEvent(db, input.id, next));
}

export async function remove(db: Database, id: string): Promise<{ id: string }> {
  await repo.deleteEvent(db, id);
  return { id };
}

export async function importEvents(
  db: Database,
  ics: string,
  calendarId?: string,
): Promise<{ imported: number }> {
  const target = calendarId ?? (await repo.ensurePrimary(db));
  const events = importIcs(ics, target);
  for (const event of events) await repo.insertEvent(db, { ...event, calendarId: target });
  return { imported: events.length };
}

export async function exportEvents(db: Database, calendarId?: string): Promise<{ ics: string }> {
  const rows = await repo.listEvents(db, calendarId ? { calendarId } : {});
  return { ics: exportIcs(rows.map(eventRowToEvent)) };
}

export function sync(db: Database, provider: CalendarProvider): Promise<SyncResult> {
  return runSync(db, provider);
}

export async function conflicts(
  db: Database,
  tz: string,
  prefs: CalPrefs,
  date?: string,
): Promise<CalendarConflict[]> {
  const d = date ?? todayInTimeZone(tz);
  const events = await expandedDay(db, d);
  const plannerBlocks = (await plannerRepo.listBlocks(db, d)).map(blockRowToBlock).map((b) => ({
    id: b.id,
    startTime: b.startTime,
    endTime: b.endTime,
    locked: b.locked,
    title: b.title,
  }));
  return calendarEngine.conflicts({
    events,
    plannerBlocks,
    workingStart: prefs.preferredStartOfDay,
    workingEnd: prefs.preferredEndOfDay,
  });
}

export async function availability(
  db: Database,
  tz: string,
  prefs: CalPrefs,
  date?: string,
): Promise<Interval[]> {
  const d = date ?? todayInTimeZone(tz);
  return calendarEngine.availability({
    date: d,
    windows: await effectiveWindows(db, prefs, d),
    events: await expandedDay(db, d),
  });
}

export async function freeBusy(
  db: Database,
  tz: string,
  prefs: CalPrefs,
  date?: string,
): Promise<FreeBusy> {
  const intervals = await availability(db, tz, prefs, date);
  return calendarEngine.freeBusy(intervals, new Date());
}

export async function summary(
  db: Database,
  tz: string,
  prefs: CalPrefs,
  date?: string,
): Promise<CalendarSummary & { syncStatus: string }> {
  const d = date ?? todayInTimeZone(tz);
  const events = await expandedDay(db, d);
  const base = calendarEngine.summary({
    date: d,
    windows: await effectiveWindows(db, prefs, d),
    events,
    now: new Date(),
  });
  const cals = await repo.listCalendars(db);
  const synced = cals.some((c) => c.lastSyncedAt);
  return { ...base, syncStatus: synced ? "synced" : "not synced" };
}

export async function toggle(db: Database, id: string, visible: boolean): Promise<Calendar> {
  return calendarRowToCalendar(await repo.toggleCalendar(db, id, visible));
}

/** Today's non-cancelled, timed events — consumed by the Planner as fixed blocks. */
export async function meetings(db: Database, tz: string, date?: string): Promise<CalendarEvent[]> {
  const d = date ?? todayInTimeZone(tz);
  const events = await expandedDay(db, d);
  return events.filter((e) => !e.allDay && e.status !== "cancelled");
}

export async function providers(db: Database): Promise<{
  calendars: Calendar[];
  available: CalendarProvider[];
}> {
  await repo.ensurePrimary(db);
  return {
    calendars: (await repo.listCalendars(db)).map(calendarRowToCalendar),
    available: AVAILABLE_PROVIDERS,
  };
}
