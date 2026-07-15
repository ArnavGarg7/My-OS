"use client";

import { Badge, Text } from "@myos/ui";
import type { NotificationHistoryEntry } from "@myos/core/notification";

/**
 * NotificationHistory (Sprint 3.3). A read-only lifecycle log — every status
 * transition, newest first.
 */
const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral" | "accent"> = {
  generated: "neutral",
  scheduled: "accent",
  delivered: "accent",
  seen: "neutral",
  snoozed: "warning",
  completed: "success",
  dismissed: "neutral",
  cancelled: "neutral",
  expired: "danger",
  archived: "neutral",
};

function time(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationHistory({ entries }: { entries: NotificationHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No notification history yet.
      </Text>
    );
  }
  return (
    <ul className="divide-border flex flex-col divide-y">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-2 py-2">
          <Badge size="sm" variant={STATUS_VARIANT[e.status] ?? "neutral"}>
            {e.status}
          </Badge>
          <Text variant="caption" tone="subtle">
            {e.note ? `${e.note} · ` : ""}
            {time(e.at)}
          </Text>
        </li>
      ))}
    </ul>
  );
}
