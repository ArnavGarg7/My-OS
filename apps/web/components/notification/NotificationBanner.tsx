"use client";

import { useEffect } from "react";
import { sortByPriority } from "@myos/core/notification";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";

/**
 * NotificationBanner (Sprint 3.3). Reuses the existing Platform toast infrastructure —
 * NO custom banner implementation. It watches the active critical/high notifications
 * and surfaces the top one as a toast once. The Notification Engine already decided it
 * should be delivered; this just routes it to the shell's toaster.
 */
export function NotificationBanner() {
  const toaster = useToaster();
  const active = trpc.notification.active.useQuery(undefined, { refetchInterval: 60_000 });

  useEffect(() => {
    const list = active.data ?? [];
    const top = sortByPriority(list).find(
      (n) => (n.priority === "critical" || n.priority === "high") && n.status === "delivered",
    );
    if (top) {
      const key = `notif-banner-${top.id}-${top.updatedAt}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        if (top.priority === "critical") toaster.error(top.title);
        else toaster.info(top.title);
      }
    }
  }, [active.data, toaster]);

  return null;
}
