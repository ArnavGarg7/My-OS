import type {
  AvailabilityType,
  CalendarConflictType,
  CalendarProvider,
  EventStatus,
  RecurrenceFrequency,
  Weekday,
} from "./constants";

/**
 * Calendar domain types (Sprint 2.7). Events are absolute instants (ISO/UTC)
 * with a timezone label. The engine works in absolute time; timezone is used for
 * display + all-day handling.
 */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // every N periods
  count?: number | null | undefined; // ends after N occurrences
  until?: string | null | undefined; // ends on/after this ISO instant
  byWeekday?: Weekday[] | null | undefined; // for weekly (e.g. weekdays only)
  exdates?: string[] | undefined; // ISO instants to skip
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  calendarId: string;
  location: string;
  startAt: string; // ISO
  endAt: string; // ISO
  timezone: string;
  allDay: boolean;
  status: EventStatus;
  source: CalendarProvider;
  recurrenceRule: RecurrenceRule | null;
  recurrenceParent: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  provider: CalendarProvider;
  primary: boolean;
  visible: boolean;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
}

export interface AvailabilityWindow {
  id: string;
  weekday: number; // 0–6 (Sun–Sat)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: AvailabilityType;
}

/** An immutable time interval with a classification. */
export interface Interval {
  start: string; // ISO
  end: string; // ISO
  type: AvailabilityType;
  label: string;
  eventId?: string;
}

export interface FreeBusy {
  busyMinutes: number;
  freeMinutes: number;
  meetingMinutes: number;
  focusMinutes: number;
  personalMinutes: number;
  busyPercent: number;
  freePercent: number;
  longestFreeSlot: { start: string; end: string; minutes: number } | null;
  nextFreeWindow: { start: string; end: string; minutes: number } | null;
}

export interface CalendarConflict {
  type: CalendarConflictType;
  message: string;
  eventIds: string[];
}

export interface SyncResult {
  provider: CalendarProvider;
  status: "success" | "error";
  imported: number;
  updated: number;
  deleted: number;
  error?: string;
}

/** Parser output — an event-shaped draft. */
export interface EventDraft {
  title: string;
  startAt: string | null;
  endAt: string | null;
  allDay: boolean;
  location: string;
}

export interface CalendarSummary {
  meetingCount: number;
  firstMeeting: CalendarEvent | null;
  currentEvent: CalendarEvent | null;
  nextEvent: CalendarEvent | null;
  freeBusy: FreeBusy;
}
