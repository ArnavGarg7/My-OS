import "server-only";
import type {
  NotificationHistoryRow,
  NotificationPreferencesRow,
  NotificationRow,
} from "@myos/db/schema";
import type {
  CategoryPreference,
  DeliveryChannel,
  EscalationLevel,
  Notification,
  NotificationHistoryEntry,
  NotificationPreferences,
  NotificationStatus,
} from "@myos/core/notification";
import { defaultPreferences } from "@myos/core/notification";

/**
 * Notification mappers (Sprint 3.3). Convert persisted rows into the pure domain
 * shapes the engine operates on, and back. Scheduling/delivery decisions are never
 * stored — they derive at read time.
 */
function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    priority: row.priority,
    status: row.status,
    title: row.title,
    reason: row.reason,
    source: row.source,
    dedupeKey: row.dedupeKey,
    trigger: row.trigger,
    condition: row.condition,
    payload: (row.payload as Record<string, unknown>) ?? {},
    sourceHref: row.sourceHref,
    createdAt: row.createdAt.toISOString(),
    scheduledFor: iso(row.scheduledFor),
    deliveredAt: iso(row.deliveredAt),
    seenAt: iso(row.seenAt),
    snoozedUntil: iso(row.snoozedUntil),
    snoozeCount: row.snoozeCount,
    completedAt: iso(row.completedAt),
    expiresAt: iso(row.expiresAt),
    channels: (row.channels as DeliveryChannel[]) ?? [],
    escalation: row.escalation as EscalationLevel,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function notificationToColumns(n: Notification) {
  return {
    type: n.type,
    priority: n.priority,
    status: n.status,
    title: n.title,
    reason: n.reason,
    source: n.source,
    dedupeKey: n.dedupeKey,
    trigger: n.trigger,
    condition: n.condition,
    payload: n.payload,
    sourceHref: n.sourceHref,
    scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : null,
    deliveredAt: n.deliveredAt ? new Date(n.deliveredAt) : null,
    seenAt: n.seenAt ? new Date(n.seenAt) : null,
    snoozedUntil: n.snoozedUntil ? new Date(n.snoozedUntil) : null,
    snoozeCount: n.snoozeCount,
    completedAt: n.completedAt ? new Date(n.completedAt) : null,
    expiresAt: n.expiresAt ? new Date(n.expiresAt) : null,
    channels: n.channels,
    escalation: n.escalation,
    updatedAt: new Date(),
  };
}

export function rowToPreferences(
  row: NotificationPreferencesRow | undefined,
): NotificationPreferences {
  if (!row) return defaultPreferences();
  const cats = (row.categories as CategoryPreference[]) ?? [];
  const base = defaultPreferences();
  return {
    quietHours: {
      enabled: row.quietHoursEnabled,
      start: row.quietHoursStart,
      end: row.quietHoursEnd,
    },
    workingHoursOnly: row.workingHoursOnly,
    weekendSuppression: row.weekendSuppression,
    muted: row.muted,
    categories: cats.length > 0 ? cats : base.categories,
  };
}

export function preferencesToColumns(prefs: NotificationPreferences) {
  return {
    quietHoursEnabled: prefs.quietHours.enabled,
    quietHoursStart: prefs.quietHours.start,
    quietHoursEnd: prefs.quietHours.end,
    workingHoursOnly: prefs.workingHoursOnly,
    weekendSuppression: prefs.weekendSuppression,
    muted: prefs.muted,
    categories: prefs.categories,
    updatedAt: new Date(),
  };
}

export function historyRowToEntry(row: NotificationHistoryRow): NotificationHistoryEntry {
  return {
    id: row.id,
    notificationId: row.notificationId,
    status: row.status as NotificationStatus,
    at: row.at.toISOString(),
    ...(row.note ? { note: row.note } : {}),
  };
}
