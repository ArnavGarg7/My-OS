import { ACTIVE_STATUSES } from "./constants";
import type { Notification, NotificationDraft } from "./types";

/**
 * Deduplication (Sprint 3.3). Never spam. A draft with the same `dedupeKey` as an
 * existing ACTIVE notification is not a new notification — the existing one's
 * timestamp is refreshed instead. Deterministic: same key → same identity.
 */
export function buildDedupeKey(source: string, condition: string): string {
  return `${source}:${condition}`.toLowerCase().replace(/\s+/g, "-");
}

/** Find an existing active notification matching the draft's dedupe key. */
export function findDuplicate(
  existing: Notification[],
  draft: NotificationDraft,
): Notification | null {
  return (
    existing.find((n) => n.dedupeKey === draft.dedupeKey && ACTIVE_STATUSES.includes(n.status)) ??
    null
  );
}

/** True when a draft duplicates an existing active notification. */
export function isDuplicate(existing: Notification[], draft: NotificationDraft): boolean {
  return findDuplicate(existing, draft) !== null;
}

/**
 * Refresh an existing notification from a repeated draft — bump `updatedAt`, keep
 * identity/status/snooze. Content (title/reason/priority) is updated in case the
 * underlying condition changed slightly, but it is NOT re-delivered as new.
 */
export function refreshFromDraft(
  existing: Notification,
  draft: NotificationDraft,
  now: Date,
): Notification {
  return {
    ...existing,
    title: draft.title,
    reason: draft.reason,
    priority: draft.priority,
    payload: draft.payload ?? existing.payload,
    updatedAt: now.toISOString(),
  };
}
