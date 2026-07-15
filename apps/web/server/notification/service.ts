import "server-only";
import { randomUUID } from "node:crypto";
import {
  buildSummary,
  createNotificationEngine,
  generateDrafts,
  reminderToDeliverAt,
  selectActive,
  selectQueued,
  selectUnread,
  isWithinQuietHours,
  type Notification,
  type NotificationHistoryEntry,
  type NotificationPreferences,
  type NotificationSummary,
  type ReminderWindow,
} from "@myos/core/notification";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { gatherRuleContext } from "./signals";
import { scheduleNotification } from "./scheduler";
import { dispatch, type DispatchResult } from "./dispatcher";

/**
 * NotificationService (Sprint 3.3). Orchestrates the pure NotificationEngine over
 * persistence + the module signal gatherer. `generate` is the heart: gather signals →
 * run rules → reconcile (dedupe) → schedule → dispatch deliver_now. Lifecycle
 * mutations (dismiss/snooze/complete/schedule) advance the engine + persist. It holds
 * NO feature logic — modules supply the signals.
 */
const engine = createNotificationEngine(
  () => randomUUID(),
  () => new Date(),
);

export function list(db: Database, limit = 100): Promise<Notification[]> {
  return repo.listAll(db, limit);
}

export function active(db: Database): Promise<Notification[]> {
  return repo.listActive(db);
}

export async function unread(db: Database): Promise<Notification[]> {
  return selectUnread(await repo.listActive(db));
}

export async function queued(db: Database, now = new Date()): Promise<Notification[]> {
  return selectQueued(await repo.listActive(db), now);
}

export function history(db: Database, limit = 100): Promise<NotificationHistoryEntry[]> {
  return repo.listHistory(db, limit);
}

export function preferences(db: Database): Promise<NotificationPreferences> {
  return repo.getPreferences(db);
}

/**
 * Generate notifications from the current module signals. Deterministic + idempotent:
 * duplicate conditions refresh existing notifications instead of spamming new ones.
 * Returns the freshly created/delivered set.
 */
export async function generate(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<{ created: number; delivered: number; suppressed: number }> {
  const [ctx, existing, prefs] = await Promise.all([
    gatherRuleContext(db, tz, now),
    repo.listActive(db),
    repo.getPreferences(db),
  ]);

  const drafts = generateDrafts(ctx);
  const { created, refreshed } = engine.reconcile(drafts, existing);

  // Persist refreshed (dedup) notifications' updated content.
  for (const r of refreshed) await repo.update(db, r).catch(() => undefined);

  let delivered = 0;
  let suppressed = 0;
  for (const n of created) {
    await repo.insert(db, n);
    await repo.recordHistory(db, { notificationId: n.id, status: "generated" });
    const { action } = await scheduleNotification(db, engine, n, prefs, tz);
    if (action === "deliver_now") {
      const current = await repo.getById(db, n.id);
      if (current) {
        const result = await dispatch(db, engine, current, prefs);
        if (result.delivered) delivered += 1;
        else suppressed += 1;
      }
    } else if (action === "suppress" || action === "expire") {
      suppressed += 1;
    }
  }

  return { created: created.length, delivered, suppressed };
}

async function requireNotification(db: Database, id: string): Promise<Notification> {
  const n = await repo.getById(db, id);
  if (!n) throw new Error("Notification not found");
  return n;
}

export async function dismiss(db: Database, id: string): Promise<Notification> {
  const n = engine.dismiss(await requireNotification(db, id));
  const saved = await repo.update(db, n);
  await repo.dequeue(db, id);
  await repo.recordHistory(db, { notificationId: id, status: "dismissed" });
  return saved;
}

export async function complete(db: Database, id: string): Promise<Notification> {
  const n = engine.complete(await requireNotification(db, id));
  const saved = await repo.update(db, n);
  await repo.dequeue(db, id);
  await repo.recordHistory(db, { notificationId: id, status: "completed" });
  return saved;
}

export async function markSeen(db: Database, id: string): Promise<Notification> {
  const current = await requireNotification(db, id);
  if (current.status !== "delivered") return current;
  const saved = await repo.update(db, engine.markSeen(current));
  await repo.recordHistory(db, { notificationId: id, status: "seen" });
  return saved;
}

export async function snooze(
  db: Database,
  id: string,
  window?: ReminderWindow,
  minutes?: number,
  now = new Date(),
): Promise<Notification> {
  const current = await requireNotification(db, id);
  const resolvedMinutes =
    minutes ??
    (window
      ? Math.max(
          0,
          Math.round(
            (Date.parse(reminderToDeliverAt(window, now, minutes)) - now.getTime()) / 60_000,
          ),
        )
      : undefined);
  const n = engine.snooze(current, resolvedMinutes);
  const saved = await repo.update(db, n);
  if (n.snoozedUntil) await repo.enqueue(db, id, n.snoozedUntil, "Snoozed");
  await repo.recordHistory(db, { notificationId: id, status: "snoozed" });
  return saved;
}

export async function schedule(
  db: Database,
  id: string,
  window?: ReminderWindow,
  minutes?: number,
  now = new Date(),
): Promise<Notification> {
  const current = await requireNotification(db, id);
  const deliverAt = window
    ? reminderToDeliverAt(window, now, minutes)
    : new Date(now.getTime() + (minutes ?? 0) * 60_000).toISOString();
  const n = engine.markScheduled(current, deliverAt);
  const saved = await repo.update(db, n);
  await repo.enqueue(db, id, deliverAt, "Scheduled");
  await repo.recordHistory(db, { notificationId: id, status: "scheduled" });
  return saved;
}

export interface UpdatePreferencesPatch {
  quietHours?: { enabled: boolean; start: string; end: string } | undefined;
  workingHoursOnly?: boolean | undefined;
  weekendSuppression?: boolean | undefined;
  muted?: boolean | undefined;
  category?:
    | ({ type: NotificationPreferences["categories"][number]["type"] } & Record<string, unknown>)
    | undefined;
}

export async function updatePreferences(
  db: Database,
  patch: UpdatePreferencesPatch,
): Promise<NotificationPreferences> {
  const current = await repo.getPreferences(db);
  const { category, ...rest } = patch;
  let next: NotificationPreferences = {
    ...current,
    ...(rest.quietHours !== undefined ? { quietHours: rest.quietHours } : {}),
    ...(rest.workingHoursOnly !== undefined ? { workingHoursOnly: rest.workingHoursOnly } : {}),
    ...(rest.weekendSuppression !== undefined
      ? { weekendSuppression: rest.weekendSuppression }
      : {}),
    ...(rest.muted !== undefined ? { muted: rest.muted } : {}),
  };
  if (category) {
    const { type, ...catPatch } = category;
    next = {
      ...next,
      categories: next.categories.some((c) => c.type === type)
        ? next.categories.map((c) => (c.type === type ? { ...c, ...catPatch } : c))
        : [
            ...next.categories,
            {
              type,
              enabled: true,
              desktop: false,
              push: false,
              sound: false,
              banner: true,
              persistent: false,
              ...catPatch,
            },
          ],
    };
  }
  return repo.savePreferences(db, next);
}

export async function summary(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<NotificationSummary> {
  const [notifications, prefs] = await Promise.all([repo.listActive(db), repo.getPreferences(db)]);
  return buildSummary(
    notifications,
    now,
    prefs.muted,
    isWithinQuietHours(prefs.quietHours, now, tz),
  );
}

export async function count(db: Database, tz: string, now = new Date()) {
  const [notifications, prefs, qCount] = await Promise.all([
    repo.listActive(db),
    repo.getPreferences(db),
    repo.queueCount(db),
  ]);
  const active = selectActive(notifications);
  return {
    unread: selectUnread(active).length,
    queued: qCount,
    active: active.length,
    muted: prefs.muted,
    inQuietHours: isWithinQuietHours(prefs.quietHours, now, tz),
  };
}

/** Bulk actions for the command center. */
export async function dismissAll(db: Database): Promise<number> {
  const active = await repo.listActive(db);
  const ids = active.map((n) => n.id);
  await repo.bulkSetStatus(db, ids, "dismissed");
  return ids.length;
}

export async function markAllRead(db: Database): Promise<number> {
  const active = await repo.listActive(db);
  const ids = active.filter((n) => n.status === "delivered").map((n) => n.id);
  await repo.bulkSetStatus(db, ids, "seen");
  return ids.length;
}

export type { DispatchResult };
