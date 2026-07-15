import { computeAvailability } from "./availability";
import { computeFreeBusy } from "./freebusy";
import { detectConflicts, type PlannerBlockLike } from "./conflicts";
import { expandRecurrence } from "./recurrence";
import { currentEvent, firstMeeting, meetingCount, nextEvent, sortEvents } from "./selectors";
import type {
  AvailabilityWindow,
  CalendarConflict,
  CalendarEvent,
  CalendarSummary,
  FreeBusy,
  Interval,
} from "./types";

/**
 * CalendarEngine (Sprint 2.7). Pure, deterministic orchestration over the
 * calendar sub-engines. It normalizes events, expands recurrence, merges
 * calendars, and derives conflicts / availability / free-busy. No DB, browser,
 * React or randomness. The Planner consumes this instead of modelling time.
 */
export class CalendarEngine {
  /** Merge many calendars' events, drop cancelled duplicates, sort. */
  mergeCalendars(lists: CalendarEvent[][]): CalendarEvent[] {
    const seen = new Map<string, CalendarEvent>();
    for (const list of lists) for (const e of list) if (e.id) seen.set(e.id, e);
    return sortEvents([...seen.values()]);
  }

  /** Expand every event's recurrence within [rangeStart, rangeEnd]. */
  expand(events: CalendarEvent[], rangeStartIso: string, rangeEndIso: string): CalendarEvent[] {
    const out: CalendarEvent[] = [];
    for (const event of events) out.push(...expandRecurrence(event, rangeStartIso, rangeEndIso));
    return sortEvents(out);
  }

  availability(input: {
    date: string;
    windows: AvailabilityWindow[];
    events: CalendarEvent[];
  }): Interval[] {
    return computeAvailability(input);
  }

  freeBusy(intervals: Interval[], now?: Date): FreeBusy {
    return computeFreeBusy(intervals, now);
  }

  conflicts(input: {
    events: CalendarEvent[];
    plannerBlocks?: PlannerBlockLike[];
    workingStart?: string;
    workingEnd?: string;
  }): CalendarConflict[] {
    return detectConflicts(input);
  }

  /** A headline summary for the status bar / context panel / morning briefing. */
  summary(input: {
    date: string;
    windows: AvailabilityWindow[];
    events: CalendarEvent[];
    now: Date;
  }): CalendarSummary {
    const intervals = this.availability({
      date: input.date,
      windows: input.windows,
      events: input.events,
    });
    return {
      meetingCount: meetingCount(input.events),
      firstMeeting: firstMeeting(input.events),
      currentEvent: currentEvent(input.events, input.now),
      nextEvent: nextEvent(input.events, input.now),
      freeBusy: this.freeBusy(intervals, input.now),
    };
  }
}

export const calendarEngine = new CalendarEngine();
