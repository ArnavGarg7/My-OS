import "server-only";
import type {
  NotificationEngine,
  Notification,
  NotificationPreferences,
} from "@myos/core/notification";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Notification scheduling (Sprint 3.3). Server-side coordinator over the PURE core
 * scheduler. Runs the deterministic schedule decision, then persists the queue +
 * notification status. No timers — this runs on demand (generate / cron trigger).
 */
export async function scheduleNotification(
  db: Database,
  engine: NotificationEngine,
  notification: Notification,
  prefs: NotificationPreferences,
  tz: string,
): Promise<{ notification: Notification; action: string }> {
  const decision = engine.schedule(notification, { timezone: tz, prefs });

  if (decision.action === "expire") {
    const expired = engine.expire(notification);
    await repo.update(db, expired);
    await repo.dequeue(db, notification.id);
    await repo.recordHistory(db, { notificationId: notification.id, status: "expired" });
    return { notification: expired, action: decision.action };
  }

  if (decision.action === "suppress") {
    // Keep it recorded but not delivered; drop from the queue.
    await repo.dequeue(db, notification.id);
    return { notification, action: decision.action };
  }

  if (decision.action === "delay" || decision.action === "queue") {
    const scheduled = engine.markScheduled(notification, decision.deliverAt);
    await repo.update(db, scheduled);
    if (decision.deliverAt)
      await repo.enqueue(db, notification.id, decision.deliverAt, decision.reason);
    await repo.recordHistory(db, {
      notificationId: notification.id,
      status: "scheduled",
      note: decision.reason,
    });
    return { notification: scheduled, action: decision.action };
  }

  // deliver_now — leave to the dispatcher; ensure status is at least scheduled.
  const scheduled = engine.markScheduled(notification, decision.deliverAt);
  await repo.update(db, scheduled);
  await repo.dequeue(db, notification.id);
  return { notification: scheduled, action: decision.action };
}
