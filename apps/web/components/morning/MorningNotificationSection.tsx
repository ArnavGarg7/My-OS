"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { sortByPriority } from "@myos/core/notification";
import { trpc } from "@/lib/trpc/client";
import { PRIORITY_BADGE, PRIORITY_LABEL } from "@/components/notification/notification-icons";

/**
 * Morning Briefing notification slot (Sprint 3.3). A summary of what needs attention —
 * unread count + any critical notifications. Read-only; the Notification Engine
 * decided what exists. Links to the full center.
 */
export function MorningNotificationSection() {
  const count = trpc.notification.count.useQuery();
  const active = trpc.notification.active.useQuery();
  const c = count.data;
  const critical = sortByPriority(active.data ?? []).filter((n) => n.priority === "critical");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Bell size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {c && c.unread > 0
            ? `${c.unread} unread notification${c.unread === 1 ? "" : "s"}`
            : "You're all caught up"}
        </Text>
      </div>
      {critical.length > 0 ? (
        <div className="flex flex-col gap-1">
          {critical.slice(0, 3).map((n) => (
            <span key={n.id} className="flex items-center gap-2">
              <Badge size="sm" variant={PRIORITY_BADGE[n.priority]}>
                {PRIORITY_LABEL[n.priority]}
              </Badge>
              <Text variant="body-s" className="truncate">
                {n.title}
              </Text>
            </span>
          ))}
        </div>
      ) : null}
      <Link href="/notifications" className="text-accent text-sm hover:underline">
        Open notifications →
      </Link>
    </div>
  );
}
