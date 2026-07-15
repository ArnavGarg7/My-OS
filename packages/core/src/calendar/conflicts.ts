import { ms, timezonesDiffer } from "./timezone";
import type { CalendarConflict, CalendarEvent } from "./types";

/**
 * Conflict engine (Sprint 2.7). Deterministically detects calendar problems —
 * overlaps, double-bookings, work outside working hours, planner-block
 * collisions, impossible recurrence and timezone mismatches. Never auto-resolves.
 */
function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
  return ms(a.startAt) < ms(b.endAt) && ms(b.startAt) < ms(a.endAt);
}

export interface PlannerBlockLike {
  id: string;
  startTime: string;
  endTime: string;
  locked: boolean;
  title: string;
}

export function detectConflicts(input: {
  events: CalendarEvent[];
  plannerBlocks?: PlannerBlockLike[];
  workingStart?: string; // HH:MM
  workingEnd?: string; // HH:MM
}): CalendarConflict[] {
  const { events, plannerBlocks = [], workingStart, workingEnd } = input;
  const conflicts: CalendarConflict[] = [];
  const active = events.filter((e) => e.status !== "cancelled");

  // Overlaps + double-booking (two confirmed meetings at once).
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]!;
      const b = active[j]!;
      if (!overlaps(a, b)) continue;
      const bothConfirmed = a.status === "confirmed" && b.status === "confirmed";
      conflicts.push({
        type: bothConfirmed ? "double-booking" : "overlap",
        message: `"${a.title}" overlaps "${b.title}".`,
        eventIds: [a.id, b.id],
      });
      if (timezonesDiffer(a.timezone, b.timezone)) {
        conflicts.push({
          type: "timezone-mismatch",
          message: `"${a.title}" (${a.timezone}) and "${b.title}" (${b.timezone}) use different timezones.`,
          eventIds: [a.id, b.id],
        });
      }
    }
  }

  // Outside working hours.
  if (workingStart && workingEnd) {
    for (const e of active) {
      const startMin = localMinutes(e.startAt);
      const endMin = localMinutes(e.endAt);
      if (startMin < toMinutes(workingStart) || endMin > toMinutes(workingEnd)) {
        conflicts.push({
          type: "outside-working-hours",
          message: `"${e.title}" falls outside your working hours.`,
          eventIds: [e.id],
        });
      }
    }
  }

  // Planner-block collisions (a meeting overlapping a planner task block).
  for (const e of active) {
    for (const block of plannerBlocks) {
      if (ms(e.startAt) < ms(block.endTime) && ms(block.startTime) < ms(e.endAt)) {
        conflicts.push({
          type: "planner-collision",
          message: `"${e.title}" collides with planned "${block.title}".`,
          eventIds: [e.id],
        });
      }
    }
  }

  // Impossible recurrence (end before start).
  for (const e of active) {
    if (ms(e.endAt) <= ms(e.startAt)) {
      conflicts.push({
        type: "impossible-recurrence",
        message: `"${e.title}" ends before it starts.`,
        eventIds: [e.id],
      });
    }
  }

  return conflicts;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

function localMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}
