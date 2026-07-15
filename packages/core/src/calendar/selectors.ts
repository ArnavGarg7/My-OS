import { dateKeyInZone, ms } from "./timezone";
import type { Calendar, CalendarEvent } from "./types";

/**
 * Calendar selectors (Sprint 2.7). Pure read helpers over an expanded event
 * list — sorting, day filtering, current/next event, meeting counts.
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort(
    (a, b) => ms(a.startAt) - ms(b.startAt) || a.title.localeCompare(b.title),
  );
}

export function eventsOnDay(
  events: CalendarEvent[],
  date: string,
  timezone = "UTC",
): CalendarEvent[] {
  return sortEvents(events.filter((e) => dateKeyInZone(e.startAt, timezone) === date));
}

export function currentEvent(events: CalendarEvent[], now: Date): CalendarEvent | null {
  const t = now.getTime();
  return (
    sortEvents(events).find(
      (e) => e.status !== "cancelled" && ms(e.startAt) <= t && t < ms(e.endAt),
    ) ?? null
  );
}

export function nextEvent(events: CalendarEvent[], now: Date): CalendarEvent | null {
  const t = now.getTime();
  return sortEvents(events).find((e) => e.status !== "cancelled" && ms(e.startAt) > t) ?? null;
}

export function firstMeeting(events: CalendarEvent[]): CalendarEvent | null {
  return sortEvents(events).find((e) => e.status !== "cancelled" && !e.allDay) ?? null;
}

export function meetingCount(events: CalendarEvent[]): number {
  return events.filter((e) => e.status !== "cancelled" && !e.allDay).length;
}

export function visibleEvents(events: CalendarEvent[], calendars: Calendar[]): CalendarEvent[] {
  const hidden = new Set(calendars.filter((c) => !c.visible).map((c) => c.id));
  return events.filter((e) => !hidden.has(e.calendarId));
}

export function eventsByCalendar(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = map.get(e.calendarId) ?? [];
    list.push(e);
    map.set(e.calendarId, list);
  }
  return map;
}
