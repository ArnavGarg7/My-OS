/**
 * Calendar constants (Sprint 2.7). The Calendar is the single source of truth
 * for time in My OS — events, meetings, recurrence, availability, free/busy.
 * Deterministic: no AI, no randomness.
 */

export const CALENDAR_PROVIDERS = ["local", "google", "outlook", "apple", "ics"] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

export const EVENT_STATUSES = ["confirmed", "tentative", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Interval classification produced by the availability engine. */
export const AVAILABILITY_TYPES = [
  "working",
  "meeting",
  "break",
  "busy",
  "available",
  "focus",
  "personal",
] as const;
export type AvailabilityType = (typeof AVAILABILITY_TYPES)[number];

export const SYNC_STATUSES = ["idle", "running", "success", "error"] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const WEEKDAY_INDEX: Record<Weekday, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/** How many occurrences a recurrence may expand to (safety bound). */
export const MAX_OCCURRENCES = 366;

export const CONFLICT_TYPES = [
  "overlap",
  "double-booking",
  "outside-working-hours",
  "planner-collision",
  "impossible-recurrence",
  "timezone-mismatch",
] as const;
export type CalendarConflictType = (typeof CONFLICT_TYPES)[number];

/** Default per-weekday working window when no availability windows are set. */
export const DEFAULT_WORKING_START = "09:00";
export const DEFAULT_WORKING_END = "18:00";

/** A "long" uninterrupted slot for deep-work detection (minutes). */
export const DEEP_WORK_MINUTES = 90;
