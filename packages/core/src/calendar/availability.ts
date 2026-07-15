import type { AvailabilityType } from "./constants";
import { ms } from "./timezone";
import type { AvailabilityWindow, CalendarEvent, Interval } from "./types";

/**
 * Availability engine (Sprint 2.7). Reduces working hours, availability windows
 * and events into an immutable, gap-free set of classified intervals for a day.
 * Deterministic — precedence: meeting > break > focus > available > personal.
 */
function atTime(date: string, hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.getTime();
}

const LABELS: Record<AvailabilityType, string> = {
  working: "Working",
  meeting: "Meeting",
  break: "Break",
  busy: "Busy",
  available: "Available",
  focus: "Focus",
  personal: "Personal time",
};

const PRECEDENCE: AvailabilityType[] = ["meeting", "busy", "break", "focus", "available"];

export function computeAvailability(input: {
  date: string;
  windows: AvailabilityWindow[];
  events: CalendarEvent[];
}): Interval[] {
  const { date, windows, events } = input;
  const dayStart = atTime(date, "00:00");
  const dayEnd = dayStart + 24 * 60 * 60_000;
  const weekday = new Date(`${date}T00:00:00`).getDay();

  // Windowed spans (working/break/focus/etc.) for this weekday.
  const spans = windows
    .filter((w) => w.weekday === weekday)
    .map((w) => ({
      start: atTime(date, w.startTime),
      end: atTime(date, w.endTime),
      type: w.type === "working" ? ("available" as AvailabilityType) : w.type,
    }));

  // Event spans (clamped to the day).
  const eventSpans = events
    .map((e) => ({
      start: Math.max(ms(e.startAt), dayStart),
      end: Math.min(ms(e.endAt), dayEnd),
      eventId: e.id,
    }))
    .filter((s) => s.end > s.start);

  // Boundary points.
  const points = new Set<number>([dayStart, dayEnd]);
  for (const s of spans) {
    if (s.start > dayStart) points.add(s.start);
    if (s.end < dayEnd) points.add(s.end);
  }
  for (const s of eventSpans) {
    points.add(s.start);
    points.add(s.end);
  }
  const sorted = [...points].sort((a, b) => a - b);

  const segments: Interval[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    const mid = (a + b) / 2;

    const event = eventSpans.find((s) => s.start <= mid && mid < s.end);
    let type: AvailabilityType;
    let eventId: string | undefined;
    if (event) {
      type = "meeting";
      eventId = event.eventId;
    } else {
      const covering = spans.filter((s) => s.start <= mid && mid < s.end).map((s) => s.type);
      type = PRECEDENCE.find((p) => covering.includes(p)) ?? "personal";
    }

    segments.push({
      start: new Date(a).toISOString(),
      end: new Date(b).toISOString(),
      type,
      label: LABELS[type],
      ...(eventId ? { eventId } : {}),
    });
  }

  // Merge adjacent same-type segments.
  const merged: Interval[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type && last.eventId === seg.eventId && last.end === seg.start) {
      last.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}
