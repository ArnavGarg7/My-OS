import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  notificationHistory,
  notificationPreferences,
  notificationQueue,
  notifications,
  type NotificationHistoryRow,
  type NotificationPreferencesRow,
  type NotificationRow,
} from "@myos/db/schema";
import {
  ACTIVE_STATUSES,
  type Notification,
  type NotificationHistoryEntry,
  type NotificationPreferences,
} from "@myos/core/notification";
import {
  historyRowToEntry,
  notificationToColumns,
  preferencesToColumns,
  rowToNotification,
  rowToPreferences,
} from "./mapper";

/**
 * Notification persistence (Sprint 3.3). Stores notifications + queue + preferences +
 * history. The active set is any non-terminal notification; the queue mirrors future
 * deliveries for quick lookup.
 */
export async function listAll(db: Database, limit = 100): Promise<Notification[]> {
  const rows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map(rowToNotification);
}

export async function listActive(db: Database): Promise<Notification[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(inArray(notifications.status, [...ACTIVE_STATUSES]))
    .orderBy(desc(notifications.createdAt));
  return rows.map(rowToNotification);
}

export async function getById(db: Database, id: string): Promise<Notification | null> {
  const [row] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return row ? rowToNotification(row as NotificationRow) : null;
}

export async function insert(db: Database, n: Notification): Promise<Notification> {
  const [row] = await db
    .insert(notifications)
    .values({ id: n.id, ...notificationToColumns(n), createdAt: new Date(n.createdAt) })
    .returning();
  if (!row) throw new Error("Failed to insert notification");
  return rowToNotification(row);
}

export async function update(db: Database, n: Notification): Promise<Notification> {
  const [row] = await db
    .update(notifications)
    .set(notificationToColumns(n))
    .where(eq(notifications.id, n.id))
    .returning();
  if (!row) throw new Error("Notification not found");
  return rowToNotification(row);
}

// --- queue ---
export async function enqueue(
  db: Database,
  notificationId: string,
  deliverAt: string,
  reason: string,
): Promise<void> {
  await db.delete(notificationQueue).where(eq(notificationQueue.notificationId, notificationId));
  await db
    .insert(notificationQueue)
    .values({ notificationId, deliverAt: new Date(deliverAt), reason });
}

export async function dequeue(db: Database, notificationId: string): Promise<void> {
  await db.delete(notificationQueue).where(eq(notificationQueue.notificationId, notificationId));
}

export async function queueCount(db: Database): Promise<number> {
  const rows = await db.select({ id: notificationQueue.id }).from(notificationQueue);
  return rows.length;
}

// --- preferences ---
export async function getPreferences(db: Database): Promise<NotificationPreferences> {
  const [row] = await db.select().from(notificationPreferences).limit(1);
  return rowToPreferences(row as NotificationPreferencesRow | undefined);
}

export async function savePreferences(
  db: Database,
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> {
  const [existing] = await db.select().from(notificationPreferences).limit(1);
  if (existing) {
    const [row] = await db
      .update(notificationPreferences)
      .set(preferencesToColumns(prefs))
      .where(eq(notificationPreferences.id, existing.id))
      .returning();
    return rowToPreferences(row as NotificationPreferencesRow);
  }
  const [row] = await db
    .insert(notificationPreferences)
    .values(preferencesToColumns(prefs))
    .returning();
  return rowToPreferences(row as NotificationPreferencesRow);
}

// --- history ---
export async function recordHistory(
  db: Database,
  entry: Omit<NotificationHistoryEntry, "id" | "at"> & { at?: string },
): Promise<void> {
  await db.insert(notificationHistory).values({
    notificationId: entry.notificationId,
    status: entry.status,
    note: entry.note ?? null,
    ...(entry.at ? { at: new Date(entry.at) } : {}),
  });
}

export async function listHistory(db: Database, limit = 100): Promise<NotificationHistoryEntry[]> {
  const rows = await db
    .select()
    .from(notificationHistory)
    .orderBy(desc(notificationHistory.at))
    .limit(limit);
  return rows.map((r) => historyRowToEntry(r as NotificationHistoryRow));
}

/** Bulk-mark active notifications (used by "dismiss all" / "mark all read"). */
export async function bulkSetStatus(
  db: Database,
  ids: string[],
  status: Notification["status"],
): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(notifications)
    .set({ status, updatedAt: new Date() })
    .where(and(inArray(notifications.id, ids)));
}
