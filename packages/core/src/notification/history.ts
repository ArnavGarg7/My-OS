import type { NotificationStatus } from "./constants";

/**
 * Notification history (Sprint 3.3). An append-only record of lifecycle transitions.
 * Pure — the engine emits these; the server persists them. Never mutated.
 */
export interface NotificationHistoryEntry {
  id: string;
  notificationId: string;
  status: NotificationStatus;
  at: string; // ISO
  note?: string;
}

export function recordTransition(
  id: string,
  notificationId: string,
  status: NotificationStatus,
  now: Date,
  note?: string,
): NotificationHistoryEntry {
  return {
    id,
    notificationId,
    status,
    at: now.toISOString(),
    ...(note ? { note } : {}),
  };
}

/** Response time (ms) between delivery and completion/dismissal, if both known. */
export function responseTimeMs(
  deliveredAt: string | null,
  resolvedAt: string | null,
): number | null {
  if (!deliveredAt || !resolvedAt) return null;
  const d = Date.parse(deliveredAt);
  const r = Date.parse(resolvedAt);
  if (Number.isNaN(d) || Number.isNaN(r)) return null;
  return Math.max(0, r - d);
}
