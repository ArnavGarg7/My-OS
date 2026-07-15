"use client";

import Link from "next/link";
import { Check, Clock, ExternalLink, X } from "lucide-react";
import { Badge, Button, Text } from "@myos/ui";
import type { Notification } from "@myos/core/notification";
import { PRIORITY_BADGE, PRIORITY_LABEL, TYPE_ICON } from "./notification-icons";

/**
 * NotificationCard (Sprint 3.3). Editorial layout — priority, title, reason, time,
 * actions. Not email, not chat. Complete / snooze / dismiss / open source.
 */
function relative(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function NotificationCard({
  notification,
  onComplete,
  onDismiss,
  onSnooze,
}: {
  notification: Notification;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
}) {
  const Icon = TYPE_ICON[notification.type];
  return (
    <article className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <Icon size={16} aria-hidden className="text-fg-subtle mt-0.5 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Text variant="body-m" className="truncate font-medium">
              {notification.title}
            </Text>
            <Badge size="sm" variant={PRIORITY_BADGE[notification.priority]}>
              {PRIORITY_LABEL[notification.priority]}
            </Badge>
          </div>
          <Text variant="body-s" tone="subtle">
            {notification.reason}
          </Text>
          <Text variant="caption" tone="subtle">
            {relative(notification.createdAt)}
          </Text>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pl-6">
        <Button size="sm" variant="secondary" onClick={() => onComplete(notification.id)}>
          <Check size={12} aria-hidden /> Complete
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onSnooze(notification.id)}>
          <Clock size={12} aria-hidden /> Snooze
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDismiss(notification.id)}>
          <X size={12} aria-hidden /> Dismiss
        </Button>
        {notification.sourceHref ? (
          <Button size="sm" variant="ghost" asChild>
            <Link href={notification.sourceHref}>
              <ExternalLink size={12} aria-hidden /> Open
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
