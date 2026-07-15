import type { CalendarEvent, RecurrenceRule } from "./types";
import type { RecurrenceFrequency, Weekday } from "./constants";

/**
 * ICS importer (Sprint 2.7). Parses a deterministic subset of RFC5545 VEVENTs —
 * SUMMARY, DTSTART, DTEND, LOCATION, DESCRIPTION, UID, STATUS, RRULE. No AI.
 */
function unfold(text: string): string[] {
  // RFC5545 line folding: continuation lines start with a space/tab.
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Parse an ICS datetime (basic form) to an ISO string. */
export function parseIcsDate(value: string): { iso: string; allDay: boolean } {
  const v = value.trim();
  const dateOnly = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) {
    return { iso: `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00:00.000Z`, allDay: true };
  }
  const dt = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (dt) {
    const [, y, mo, d, h, mi, s, z] = dt;
    const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? ".000Z" : ".000Z"}`;
    return { iso, allDay: false };
  }
  const parsed = new Date(v);
  return {
    iso: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
    allDay: false,
  };
}

export function parseRrule(value: string): RecurrenceRule | null {
  const parts = Object.fromEntries(
    value.split(";").map((kv) => {
      const [k, val] = kv.split("=");
      return [k?.toUpperCase(), val ?? ""];
    }),
  );
  const freqMap: Record<string, RecurrenceFrequency> = {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly",
  };
  const frequency = freqMap[parts.FREQ ?? ""];
  if (!frequency) return null;
  const rule: RecurrenceRule = {
    frequency,
    interval: parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1,
  };
  if (parts.COUNT) rule.count = parseInt(parts.COUNT, 10);
  if (parts.UNTIL) rule.until = parseIcsDate(parts.UNTIL).iso;
  if (parts.BYDAY) rule.byWeekday = parts.BYDAY.split(",").map((d: string) => d.trim() as Weekday);
  return rule;
}

/** Parse an ICS document into (unpersisted) events. */
export function importIcs(text: string, calendarId = "imported"): CalendarEvent[] {
  const lines = unfold(text);
  const events: CalendarEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(toEvent(current, calendarId));
      current = null;
      continue;
    }
    if (!current) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).split(";")[0]!.toUpperCase();
    current[key] = line.slice(idx + 1);
  }
  return events;
}

function toEvent(fields: Record<string, string>, calendarId: string): CalendarEvent {
  const start = parseIcsDate(fields.DTSTART ?? "");
  const end = fields.DTEND ? parseIcsDate(fields.DTEND) : { iso: start.iso, allDay: start.allDay };
  const now = new Date().toISOString();
  const status = (fields.STATUS ?? "").toLowerCase();
  return {
    id: "",
    title: fields.SUMMARY ?? "Untitled event",
    description: fields.DESCRIPTION ?? "",
    calendarId,
    location: fields.LOCATION ?? "",
    startAt: start.iso,
    endAt: end.iso,
    timezone: "UTC",
    allDay: start.allDay,
    status:
      status === "tentative" ? "tentative" : status === "cancelled" ? "cancelled" : "confirmed",
    source: "ics",
    recurrenceRule: fields.RRULE ? parseRrule(fields.RRULE) : null,
    recurrenceParent: null,
    createdAt: now,
    updatedAt: now,
  };
}
