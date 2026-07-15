import { type DeliveryChannel } from "./constants";
import { categoryPreference } from "./preferences";
import { resolveEscalation } from "./priority";
import type { DeliveryDecision, Notification, NotificationPreferences } from "./types";

/**
 * Delivery engine (Sprint 3.3). Deterministic: given a notification's priority + the
 * user's category preferences, decide WHICH channels it goes out on. The engine only
 * DECIDES — the Platform layer (Sprint 1.7) performs the actual delivery. Critical
 * always delivers on a persistent channel regardless of category toggles.
 */
export function decideDelivery(
  notification: Notification,
  prefs: NotificationPreferences,
): DeliveryDecision {
  const escalation = resolveEscalation(notification.priority, notification.snoozeCount);

  if (notification.priority === "critical") {
    return {
      deliver: true,
      channels: dedupeChannels(["persistent", "banner", "desktop", "sound"]),
      escalation,
      reason: "Critical notifications always deliver.",
    };
  }

  const cat = categoryPreference(prefs, notification.type);
  if (!cat.enabled) {
    return { deliver: false, channels: [], escalation, reason: "Category disabled." };
  }

  if (notification.priority === "silent") {
    return {
      deliver: true,
      channels: ["silent"],
      escalation,
      reason: "Silent notifications record only.",
    };
  }

  const channels: DeliveryChannel[] = [];
  if (cat.banner) channels.push("banner");
  if (cat.persistent || escalation === "persistent") channels.push("persistent");
  if (cat.desktop) channels.push("desktop");
  if (cat.push) channels.push("push");
  if (cat.sound) channels.push("sound");
  if (channels.length === 0) channels.push("toast");

  return {
    deliver: true,
    channels: dedupeChannels(channels),
    escalation,
    reason: "Delivered per category preferences.",
  };
}

function dedupeChannels(channels: DeliveryChannel[]): DeliveryChannel[] {
  return [...new Set(channels)];
}

/** Whether a channel maps to the Platform desktop/push delivery layer. */
export function isPlatformChannel(channel: DeliveryChannel): boolean {
  return channel === "desktop" || channel === "push";
}
