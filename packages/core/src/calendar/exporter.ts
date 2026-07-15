import type { CalendarEvent, RecurrenceRule } from "./types";

/**
 * ICS exporter (Sprint 2.7). Deterministically serializes events to RFC5545.
 * Round-trips with the importer for the supported subset.
 */
function icsDate(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
  if (allDay) return date;
  return `${date}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function escapeText(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function rruleToString(rule: RecurrenceRule): string {
  const parts = [`FREQ=${rule.frequency.toUpperCase()}`];
  if (rule.interval && rule.interval !== 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.count) parts.push(`COUNT=${rule.count}`);
  if (rule.until) parts.push(`UNTIL=${icsDate(rule.until, false)}`);
  if (rule.byWeekday?.length) parts.push(`BYDAY=${rule.byWeekday.join(",")}`);
  return parts.join(";");
}

function eventToVevent(event: CalendarEvent): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.id || `${Date.now()}@myos`}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DTSTART:${icsDate(event.startAt, event.allDay)}`,
    `DTEND:${icsDate(event.endAt, event.allDay)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  lines.push(`STATUS:${event.status.toUpperCase()}`);
  if (event.recurrenceRule) lines.push(`RRULE:${rruleToString(event.recurrenceRule)}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

/** Serialize events into a complete ICS document. */
export function exportIcs(events: CalendarEvent[], calendarName = "My OS"): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//My OS//Calendar//EN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...events.map(eventToVevent),
    "END:VCALENDAR",
  ].join("\r\n");
}
