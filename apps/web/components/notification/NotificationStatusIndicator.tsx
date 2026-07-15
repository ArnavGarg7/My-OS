"use client";

import { BellOff, MoonStar } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar notification indicator (Sprint 3.3): "Notifications · 3 unread · 1
 * queued", with muted / quiet-hours state. Replaces the earlier static placeholder.
 */
export function NotificationStatusIndicator() {
  const count = trpc.notification.count.useQuery(undefined, { refetchInterval: 60_000 });
  const c = count.data;
  if (!c) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${c.unread > 0 ? "bg-danger" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Notifications</span>
      <span className="text-fg-muted font-medium">{c.unread} unread</span>
      {c.queued > 0 ? <span className="text-fg-muted">· {c.queued} queued</span> : null}
      {c.muted ? <BellOff size={11} aria-hidden className="text-fg-subtle" /> : null}
      {c.inQuietHours ? <MoonStar size={11} aria-hidden className="text-fg-subtle" /> : null}
    </div>
  );
}
