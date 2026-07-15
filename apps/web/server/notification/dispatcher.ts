import "server-only";
import {
  isPlatformChannel,
  type DeliveryChannel,
  type Notification,
  type NotificationEngine,
  type NotificationPreferences,
} from "@myos/core/notification";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Notification dispatcher (Sprint 3.3). Decides delivery channels via the PURE core
 * delivery engine, marks the notification delivered, records history and returns the
 * platform-facing payload. The Platform layer (Sprint 1.7) + Push infra perform the
 * actual desktop/push delivery — the dispatcher only ROUTES.
 */
export interface DispatchResult {
  notification: Notification;
  delivered: boolean;
  channels: DeliveryChannel[];
  platformChannels: DeliveryChannel[];
}

export async function dispatch(
  db: Database,
  engine: NotificationEngine,
  notification: Notification,
  prefs: NotificationPreferences,
): Promise<DispatchResult> {
  const decision = engine.decideDelivery(notification, prefs);

  if (!decision.deliver) {
    return { notification, delivered: false, channels: [], platformChannels: [] };
  }

  const delivered = engine.markDelivered(notification, decision);
  const saved = await repo.update(db, delivered);
  await repo.dequeue(db, notification.id);
  await repo.recordHistory(db, {
    notificationId: notification.id,
    status: "delivered",
    note: decision.channels.join(","),
  });

  return {
    notification: saved,
    delivered: true,
    channels: decision.channels,
    platformChannels: decision.channels.filter(isPlatformChannel),
  };
}
