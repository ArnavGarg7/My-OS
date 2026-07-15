import { ACTIVE_STATUSES } from "./constants";
import { comparePriority } from "./priority";
import type { Notification, NotificationSummary } from "./types";

/**
 * Notification selectors (Sprint 3.3). Pure read helpers over a notification list.
 */
export function selectActive(notifications: Notification[]): Notification[] {
  return notifications.filter((n) => ACTIVE_STATUSES.includes(n.status));
}

/** Unread = delivered (or seen-but-not-resolved) and not yet acted on. */
export function isUnread(n: Notification): boolean {
  return n.status === "delivered" || n.status === "generated" || n.status === "scheduled";
}

export function selectUnread(notifications: Notification[]): Notification[] {
  return selectActive(notifications).filter(isUnread);
}

/** Queued = scheduled/snoozed for a future delivery time. */
export function selectQueued(notifications: Notification[], now: Date): Notification[] {
  const nowMs = now.getTime();
  return notifications.filter((n) => {
    if (!ACTIVE_STATUSES.includes(n.status)) return false;
    const when = n.snoozedUntil ?? n.scheduledFor;
    return when !== null && Date.parse(when) > nowMs;
  });
}

/** Sort by priority (desc) then createdAt (desc). */
export function sortByPriority(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    const p = comparePriority(a.priority, b.priority);
    if (p !== 0) return p;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function selectByType(notifications: Notification[], type: string): Notification[] {
  return notifications.filter((n) => n.type === type);
}

export function selectCritical(notifications: Notification[]): Notification[] {
  return selectActive(notifications).filter((n) => n.priority === "critical");
}

export function buildSummary(
  notifications: Notification[],
  now: Date,
  muted: boolean,
  inQuietHours: boolean,
): NotificationSummary {
  const active = selectActive(notifications);
  const unread = active.filter(isUnread).length;
  const queued = selectQueued(notifications, now).length;
  const sorted = sortByPriority(active);
  return {
    unread,
    queued,
    active: active.length,
    muted,
    inQuietHours,
    topPriority: sorted[0]?.priority ?? null,
  };
}
