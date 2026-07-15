"use client";

import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

/**
 * NotificationBadge (Sprint 3.3). A bell with an unread count — for the top bar or
 * anywhere a compact indicator is needed. Provider-driven via notification.count.
 */
export function NotificationBadge({ onClick }: { onClick?: () => void }) {
  const count = trpc.notification.count.useQuery(undefined, { refetchInterval: 60_000 });
  const unread = count.data?.unread ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      className="text-fg-muted hover:text-fg relative inline-flex size-8 items-center justify-center rounded-md"
    >
      <Bell size={16} aria-hidden />
      {unread > 0 ? (
        <span className="bg-danger text-on-accent absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );
}
