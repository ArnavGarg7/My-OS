import { REMINDER_WINDOWS, REMINDER_WINDOW_MINUTES, type ReminderWindow } from "./constants";
import type { ParsedReminder } from "./types";

/**
 * Reminder parser (Sprint 3.3). Deterministic mapping of a phrase or window key to a
 * concrete offset in minutes. Whole-word matching; unknown input → immediately.
 */
const ALIASES: Record<string, ReminderWindow> = {
  now: "immediately",
  immediately: "immediately",
  "5": "5m",
  "5m": "5m",
  five: "5m",
  "10": "10m",
  "10m": "10m",
  ten: "10m",
  "15": "15m",
  "15m": "15m",
  fifteen: "15m",
  "30": "30m",
  "30m": "30m",
  thirty: "30m",
  "60": "1h",
  "1h": "1h",
  hour: "1h",
  tomorrow: "tomorrow",
};

export function parseReminderWindow(input: string): ParsedReminder {
  const key = input.trim().toLowerCase();
  const window: ReminderWindow = (REMINDER_WINDOWS as readonly string[]).includes(key)
    ? (key as ReminderWindow)
    : (ALIASES[key] ?? "immediately");

  if (window === "tomorrow") return { window, minutes: null };
  if (window === "custom") return { window, minutes: null };
  return {
    window,
    minutes: REMINDER_WINDOW_MINUTES[window as Exclude<ReminderWindow, "tomorrow" | "custom">],
  };
}

/** Resolve a reminder window (+ optional custom minutes) into an ISO deliver time. */
export function reminderToDeliverAt(
  window: ReminderWindow,
  now: Date,
  customMinutes?: number,
  tomorrowResolver?: (now: Date) => string,
): string {
  if (window === "custom") {
    const m = Math.max(0, customMinutes ?? 0);
    return new Date(now.getTime() + m * 60_000).toISOString();
  }
  if (window === "tomorrow") {
    return tomorrowResolver
      ? tomorrowResolver(now)
      : new Date(now.getTime() + 86_400_000).toISOString();
  }
  const minutes = REMINDER_WINDOW_MINUTES[window];
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export function isReminderWindow(value: string): value is ReminderWindow {
  return (REMINDER_WINDOWS as readonly string[]).includes(value);
}
