import { DEFAULT_QUIET_END, DEFAULT_QUIET_START } from "./constants";
import type { QuietHours } from "./types";

/**
 * Quiet hours (Sprint 3.3). Pure time-window math over local HH:MM. Supports
 * overnight windows (e.g. 22:00→07:00). The engine consumes quiet hours from user
 * preferences, and callers may derive them from the Health sleep window or Tomorrow
 * Studio — but this module only does the deterministic containment check.
 */
export function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map((x) => Number.parseInt(x, 10));
  if (Number.isNaN(h ?? NaN) || Number.isNaN(m ?? NaN)) return 0;
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Local minutes-of-day for a Date in a given IANA timezone. */
export function minutesOfDayInTz(now: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const h = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  // Intl can emit "24" for midnight in some engines — normalise.
  return ((h % 24) * 60 + m) % 1440;
}

/** Whether `minutes` (0–1439) falls inside a possibly-overnight [start,end) window. */
export function isMinuteWithin(minutes: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) return false; // empty window
  if (startMin < endMin) return minutes >= startMin && minutes < endMin;
  // overnight window
  return minutes >= startMin || minutes < endMin;
}

/** Whether `now` (in `timezone`) is within the quiet-hours window. */
export function isWithinQuietHours(quiet: QuietHours, now: Date, timezone: string): boolean {
  if (!quiet.enabled) return false;
  const mins = minutesOfDayInTz(now, timezone);
  return isMinuteWithin(mins, parseHHMM(quiet.start), parseHHMM(quiet.end));
}

export function defaultQuietHours(): QuietHours {
  return { enabled: true, start: DEFAULT_QUIET_START, end: DEFAULT_QUIET_END };
}

/** Minutes until quiet hours end from `now` (0 if not in quiet hours). */
export function minutesUntilQuietEnd(quiet: QuietHours, now: Date, timezone: string): number {
  if (!isWithinQuietHours(quiet, now, timezone)) return 0;
  const mins = minutesOfDayInTz(now, timezone);
  const end = parseHHMM(quiet.end);
  const delta = end - mins;
  return delta > 0 ? delta : delta + 1440;
}

/**
 * Derive quiet hours from a sleep window (Health) — sleep start → wake time. Falls
 * back to the passed base when either bound is missing. Pure helper; the server
 * decides whether to use it.
 */
export function quietHoursFromSleep(
  sleepStart: string | null,
  wakeTime: string | null,
  base: QuietHours,
): QuietHours {
  if (!sleepStart || !wakeTime) return base;
  return { enabled: true, start: sleepStart, end: wakeTime };
}
