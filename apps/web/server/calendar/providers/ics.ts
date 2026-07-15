import "server-only";
import { importIcs, type CalendarEvent } from "@myos/core/calendar";

/**
 * Provider adapter contract (Sprint 2.7). Each adapter fetches raw events and
 * normalizes them to the domain `CalendarEvent` shape. No provider-specific
 * logic leaks outside these files.
 */
export interface ProviderAdapter {
  name: "google" | "outlook" | "apple" | "ics";
  fetch(): Promise<CalendarEvent[]>;
}

/** Build a normalized sample event for the current day (adapter stand-in). */
export function sampleEvent(
  source: CalendarEvent["source"],
  title: string,
  startHour: number,
  endHour: number,
): CalendarEvent {
  const day = new Date();
  const start = new Date(day);
  start.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
  const end = new Date(day);
  end.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);
  const iso = new Date().toISOString();
  return {
    id: "",
    title,
    description: "",
    calendarId: "",
    location: "",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    timezone: "UTC",
    allDay: false,
    status: "confirmed",
    source,
    recurrenceRule: null,
    recurrenceParent: null,
    createdAt: iso,
    updatedAt: iso,
  };
}

/** The ICS "provider" normalizes a fixed sample document (import is the main path). */
const SAMPLE_ICS = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:ics-sample@myos
SUMMARY:Imported Block
DTSTART:20260101T110000Z
DTEND:20260101T120000Z
END:VEVENT
END:VCALENDAR`;

export const icsProvider: ProviderAdapter = {
  name: "ics",
  async fetch() {
    return importIcs(SAMPLE_ICS).map((e) => ({ ...e, source: "ics" as const }));
  },
};
