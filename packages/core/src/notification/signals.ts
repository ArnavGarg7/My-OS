import { NOTIFICATION_OVERLOAD_COUNT, REPEATED_SNOOZE_COUNT } from "./constants";
import { isWithinQuietHours } from "./quiet-hours";
import { isUnread, selectActive, selectQueued } from "./selectors";
import type { Notification, NotificationPreferences, NotificationSignals } from "./types";

/**
 * Notification signals for the Decision engine (Sprint 3.3). Deterministic counts +
 * booleans derived from the current notifications + preferences. The Decision engine
 * turns these into recommendations; the Notification engine never emits decisions.
 */
export interface NotificationSignalInput {
  notifications: Notification[];
  prefs: NotificationPreferences;
  now: Date;
  timezone: string;
}

export function computeSignals(input: NotificationSignalInput): NotificationSignals {
  const { notifications, prefs, now, timezone } = input;
  const active = selectActive(notifications);
  const unread = active.filter(isUnread).length;
  const queued = selectQueued(notifications, now).length;

  const nowMs = now.getTime();
  const criticalOverdue = active.some(
    (n) =>
      n.priority === "critical" &&
      n.status !== "completed" &&
      n.expiresAt !== null &&
      Date.parse(n.expiresAt) <= nowMs,
  );

  const ignored = active.filter((n) => n.status === "delivered" || n.status === "seen").length;
  const tooManyIgnored = ignored >= NOTIFICATION_OVERLOAD_COUNT;

  const repeatedSnoozes = active.some((n) => n.snoozeCount >= REPEATED_SNOOZE_COUNT);

  return {
    unread,
    queued,
    criticalOverdue,
    tooManyIgnored,
    repeatedSnoozes,
    muted: prefs.muted,
    inQuietHours: isWithinQuietHours(prefs.quietHours, now, timezone),
  };
}
