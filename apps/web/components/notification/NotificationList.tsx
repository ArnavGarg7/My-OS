"use client";

import { Text } from "@myos/ui";
import type { Notification } from "@myos/core/notification";
import { NotificationCard } from "./NotificationCard";

/**
 * NotificationList (Sprint 3.3). Renders notification cards, or an empty state.
 */
export function NotificationList({
  notifications,
  onComplete,
  onDismiss,
  onSnooze,
  emptyLabel = "You're all caught up.",
}: {
  notifications: Notification[];
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  emptyLabel?: string;
}) {
  if (notifications.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        {emptyLabel}
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {notifications.map((n) => (
        <NotificationCard
          key={n.id}
          notification={n}
          onComplete={onComplete}
          onDismiss={onDismiss}
          onSnooze={onSnooze}
        />
      ))}
    </div>
  );
}
