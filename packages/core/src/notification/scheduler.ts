import { MAX_SNOOZES } from "./constants";
import { isWeekend } from "./preferences";
import { isWithinQuietHours, minutesUntilQuietEnd } from "./quiet-hours";
import type { Notification, NotificationPreferences, ScheduleDecision } from "./types";

/**
 * Scheduling engine (Sprint 3.3). PURE — no timers, only calculations. Given a
 * notification, the current time and preferences (incl. quiet hours), decide whether
 * it delivers now, is delayed, queued, suppressed or expired. Priority governs how
 * quiet hours / mute / working-hours rules apply:
 *   • critical  → always deliver now
 *   • high      → delay past quiet hours
 *   • medium    → delay past quiet hours; suppressed by mute
 *   • low/silent→ suppressed during quiet hours / mute
 */
const DAY_MS = 86_400_000;

function ms(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

interface ScheduleContext {
  now: Date;
  timezone: string;
  prefs: NotificationPreferences;
  /** Working-hours window in local HH:MM, when workingHoursOnly is set. */
  workingHours?: { start: string; end: string };
}

export function schedule(notification: Notification, ctx: ScheduleContext): ScheduleDecision {
  const nowMs = ctx.now.getTime();

  // Expired already?
  const expires = ms(notification.expiresAt);
  if (expires !== null && expires <= nowMs) {
    return { action: "expire", deliverAt: null, reason: "Past expiry." };
  }

  // Still snoozed?
  const snoozed = ms(notification.snoozedUntil);
  if (snoozed !== null && snoozed > nowMs) {
    return {
      action: "queue",
      deliverAt: notification.snoozedUntil,
      reason: "Snoozed until later.",
    };
  }

  // Future scheduledFor?
  const scheduled = ms(notification.scheduledFor);
  if (scheduled !== null && scheduled > nowMs) {
    return { action: "queue", deliverAt: notification.scheduledFor, reason: "Scheduled ahead." };
  }

  const critical = notification.priority === "critical";

  // Global mute (DND) — critical still delivers.
  if (ctx.prefs.muted && !critical) {
    return { action: "suppress", deliverAt: null, reason: "Notifications muted." };
  }

  // Weekend suppression (non-critical).
  if (ctx.prefs.weekendSuppression && !critical && isWeekend(ctx.now, ctx.timezone)) {
    return { action: "suppress", deliverAt: null, reason: "Weekend suppression." };
  }

  // Quiet hours.
  const inQuiet = isWithinQuietHours(ctx.prefs.quietHours, ctx.now, ctx.timezone);
  if (inQuiet && !critical) {
    const delayMin = minutesUntilQuietEnd(ctx.prefs.quietHours, ctx.now, ctx.timezone);
    const deliverAt = new Date(nowMs + delayMin * 60_000).toISOString();
    if (notification.priority === "low" || notification.priority === "silent") {
      return { action: "suppress", deliverAt: null, reason: "Low priority in quiet hours." };
    }
    // high / medium → delay to end of quiet hours
    return { action: "delay", deliverAt, reason: "Delayed past quiet hours." };
  }

  // Too many snoozes — stop re-delivering.
  if (notification.snoozeCount >= MAX_SNOOZES && !critical) {
    return { action: "suppress", deliverAt: null, reason: "Snooze limit reached." };
  }

  return {
    action: "deliver_now",
    deliverAt: notification.scheduledFor ?? ctx.now.toISOString(),
    reason: "Ready to deliver.",
  };
}

/** Resolve `tomorrow` reminder → next local morning start (default 09:00). */
export function tomorrowAt(now: Date, hourLocalStartMinutes = 540): string {
  const base = new Date(now.getTime() + DAY_MS);
  base.setUTCHours(0, 0, 0, 0);
  return new Date(base.getTime() + hourLocalStartMinutes * 60_000).toISOString();
}
