"use client";

import { Bell, BellOff, MoonStar } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { sortByPriority } from "@myos/core/notification";
import { trpc } from "@/lib/trpc/client";
import { PRIORITY_BADGE, PRIORITY_LABEL, TYPE_ICON } from "./notification-icons";

/**
 * Notification context panel (Sprint 3.3). Route-aware snapshot on /notifications —
 * upcoming/queued, critical, suppressed + quiet-hours state.
 */
export function NotificationContextPanel() {
  const count = trpc.notification.count.useQuery();
  const active = trpc.notification.active.useQuery();
  const queued = trpc.notification.list.useQuery({ status: "queued" });
  const c = count.data;

  const critical = sortByPriority(active.data ?? []).filter((n) => n.priority === "critical");

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Bell size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Notifications</Text>
      </span>

      {c ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" variant={c.unread > 0 ? "danger" : "neutral"}>
              {c.unread} unread
            </Badge>
            <Badge size="sm" variant="neutral">
              {c.queued} queued
            </Badge>
          </div>
          <div className="text-fg-subtle flex items-center gap-3 text-xs">
            {c.muted ? (
              <span className="inline-flex items-center gap-1">
                <BellOff size={11} aria-hidden /> Muted
              </span>
            ) : null}
            {c.inQuietHours ? (
              <span className="inline-flex items-center gap-1">
                <MoonStar size={11} aria-hidden /> Quiet hours
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {critical.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Critical
          </Text>
          {critical.slice(0, 3).map((n) => {
            const Icon = TYPE_ICON[n.type];
            return (
              <span key={n.id} className="inline-flex items-center gap-1.5">
                <Icon size={12} aria-hidden className="text-danger" />
                <Text variant="body-s" className="truncate">
                  {n.title}
                </Text>
              </span>
            );
          })}
        </div>
      ) : null}

      {(queued.data ?? []).length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Queued
          </Text>
          {(queued.data ?? []).slice(0, 4).map((n) => (
            <span key={n.id} className="flex items-center justify-between gap-2">
              <Text variant="body-s" className="truncate">
                {n.title}
              </Text>
              <Badge size="sm" variant={PRIORITY_BADGE[n.priority]}>
                {PRIORITY_LABEL[n.priority]}
              </Badge>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
