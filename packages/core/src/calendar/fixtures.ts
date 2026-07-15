import type { AvailabilityWindow, Calendar, CalendarEvent } from "./types";

/** Test fixtures for the calendar engine (imported by *.test.ts). */
export const DATE = "2026-07-07"; // a Tuesday
export const at = (h: number, m = 0) => {
  const d = new Date(`${DATE}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
};
export const iso = (h: number, m = 0) => at(h, m).toISOString();

export function makeEvent(over: Partial<CalendarEvent> = {}): CalendarEvent {
  const now = "2026-07-07T06:00:00.000Z";
  return {
    id: over.id ?? "e1",
    title: over.title ?? "Meeting",
    description: over.description ?? "",
    calendarId: over.calendarId ?? "cal1",
    location: over.location ?? "",
    startAt: over.startAt ?? iso(9),
    endAt: over.endAt ?? iso(10),
    timezone: over.timezone ?? "UTC",
    allDay: over.allDay ?? false,
    status: over.status ?? "confirmed",
    source: over.source ?? "local",
    recurrenceRule: over.recurrenceRule ?? null,
    recurrenceParent: over.recurrenceParent ?? null,
    createdAt: over.createdAt ?? now,
    updatedAt: over.updatedAt ?? now,
  };
}

export function makeCalendar(over: Partial<Calendar> = {}): Calendar {
  return {
    id: over.id ?? "cal1",
    name: over.name ?? "Personal",
    color: over.color ?? "blue",
    provider: over.provider ?? "local",
    primary: over.primary ?? true,
    visible: over.visible ?? true,
    syncEnabled: over.syncEnabled ?? false,
    lastSyncedAt: over.lastSyncedAt ?? null,
  };
}

export function makeWindow(over: Partial<AvailabilityWindow> = {}): AvailabilityWindow {
  return {
    id: over.id ?? "w1",
    weekday: over.weekday ?? 2, // Tuesday
    startTime: over.startTime ?? "09:00",
    endTime: over.endTime ?? "18:00",
    type: over.type ?? "working",
  };
}
