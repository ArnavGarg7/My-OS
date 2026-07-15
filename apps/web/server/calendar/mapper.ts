import "server-only";
import type {
  AvailabilityWindow,
  Calendar,
  CalendarEvent,
  RecurrenceRule,
} from "@myos/core/calendar";
import type { AvailabilityWindowRow, CalendarEventRow, CalendarRow } from "@myos/db/schema";

/**
 * Calendar row ↔ DTO mapping (Sprint 2.7). Timestamps become ISO strings for the
 * pure engine + client; the recurrence rule is stored as jsonb.
 */
export function eventRowToEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    calendarId: row.calendarId,
    location: row.location,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    timezone: row.timezone,
    allDay: row.allDay,
    status: row.status,
    source: row.source,
    recurrenceRule: (row.recurrenceRule as RecurrenceRule | null) ?? null,
    recurrenceParent: row.recurrenceParent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function eventToColumns(event: CalendarEvent) {
  return {
    title: event.title,
    description: event.description,
    calendarId: event.calendarId,
    location: event.location,
    startAt: new Date(event.startAt),
    endAt: new Date(event.endAt),
    timezone: event.timezone,
    allDay: event.allDay,
    status: event.status,
    source: event.source,
    recurrenceRule: event.recurrenceRule as Record<string, unknown> | null,
    recurrenceParent: event.recurrenceParent,
    updatedAt: new Date(event.updatedAt),
  };
}

export function calendarRowToCalendar(row: CalendarRow): Calendar {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    provider: row.provider,
    primary: row.primary,
    visible: row.visible,
    syncEnabled: row.syncEnabled,
    lastSyncedAt: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
  };
}

export function windowRowToWindow(row: AvailabilityWindowRow): AvailabilityWindow {
  return {
    id: row.id,
    weekday: row.weekday,
    startTime: row.startTime,
    endTime: row.endTime,
    type: row.type,
  };
}
