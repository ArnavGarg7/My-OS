/**
 * Notification engine constants (Sprint 3.3). The Notification Engine is a PLATFORM
 * engine (like Timeline/Analytics/Decision) — it holds NO feature logic. Modules
 * supply signals; the engine decides whether a notification should exist, when it
 * delivers, and through which channel. Deterministic — every threshold lives here.
 * No AI, no randomness, no timers.
 */

/** Notification categories. Each maps to a source module (or a generic kind). */
export const NOTIFICATION_TYPES = [
  "reminder",
  "alert",
  "information",
  "warning",
  "success",
  "system",
  "health",
  "calendar",
  "planner",
  "finance",
  "goals",
  "projects",
  "focus",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Priority drives delivery, snooze, quiet-hours handling, escalation, visibility. */
export const NOTIFICATION_PRIORITIES = ["critical", "high", "medium", "low", "silent"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

/** Numeric rank for ordering (higher = more urgent). */
export const PRIORITY_RANK: Record<NotificationPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  silent: 0,
};

/** Lifecycle status (DB enum `notification_status`). */
export const NOTIFICATION_STATUSES = [
  "generated",
  "scheduled",
  "delivered",
  "seen",
  "snoozed",
  "completed",
  "archived",
  "dismissed",
  "cancelled",
  "expired",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Statuses that are terminal (no further delivery). */
export const TERMINAL_STATUSES: readonly NotificationStatus[] = [
  "completed",
  "archived",
  "dismissed",
  "cancelled",
  "expired",
];

/** Statuses in which a notification is "active" (still relevant to the user). */
export const ACTIVE_STATUSES: readonly NotificationStatus[] = [
  "generated",
  "scheduled",
  "delivered",
  "seen",
  "snoozed",
];

/** Delivery channels (DB enum `delivery_channel`). Platform layer performs delivery. */
export const DELIVERY_CHANNELS = [
  "banner",
  "toast",
  "persistent",
  "silent",
  "desktop",
  "push",
  "sound",
] as const;
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

/** Escalation ladder (rule-based, deterministic). */
export const ESCALATION_LEVELS = ["silent", "banner", "persistent", "critical"] as const;
export type EscalationLevel = (typeof ESCALATION_LEVELS)[number];

/** Reminder windows offered to the user (minutes; `tomorrow`/`custom` are special). */
export const REMINDER_WINDOWS = [
  "immediately",
  "5m",
  "10m",
  "15m",
  "30m",
  "1h",
  "tomorrow",
  "custom",
] as const;
export type ReminderWindow = (typeof REMINDER_WINDOWS)[number];

/** Minutes for each fixed reminder window (`tomorrow`/`custom` resolved elsewhere). */
export const REMINDER_WINDOW_MINUTES: Record<
  Exclude<ReminderWindow, "tomorrow" | "custom">,
  number
> = {
  immediately: 0,
  "5m": 5,
  "10m": 10,
  "15m": 15,
  "30m": 30,
  "1h": 60,
};

/** A scheduler decision. */
export const SCHEDULE_ACTIONS = ["deliver_now", "delay", "queue", "suppress", "expire"] as const;
export type ScheduleAction = (typeof SCHEDULE_ACTIONS)[number];

/** Default snooze length in minutes when none supplied. */
export const DEFAULT_SNOOZE_MINUTES = 30;
/** How many times a notification may be snoozed before it stops re-delivering. */
export const MAX_SNOOZES = 5;
/** Repeated snoozes at/above this count are flagged to the Decision engine. */
export const REPEATED_SNOOZE_COUNT = 3;
/** Ignored/undelivered-seen notifications at/above this count → "too many" signal. */
export const NOTIFICATION_OVERLOAD_COUNT = 15;
/** Default time-to-live for a notification (minutes) before it expires unseen. */
export const DEFAULT_TTL_MINUTES = 1440; // 24h

/** Default quiet hours (local HH:MM) when the user hasn't set any. */
export const DEFAULT_QUIET_START = "22:00";
export const DEFAULT_QUIET_END = "07:00";

/** Map a notification priority onto its base escalation level. */
export function escalationForPriority(priority: NotificationPriority): EscalationLevel {
  switch (priority) {
    case "critical":
      return "critical";
    case "high":
      return "persistent";
    case "medium":
      return "banner";
    default:
      return "silent";
  }
}
