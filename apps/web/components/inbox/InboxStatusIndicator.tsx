"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar inbox indicator (Sprint 2.4): "Inbox · N items". Reflects the
 * count of unprocessed captures.
 */
export function InboxStatusIndicator() {
  const count = trpc.inbox.countNew.useQuery(undefined, { refetchInterval: 60_000 });
  const n = count.data ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${n > 0 ? "bg-accent" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Inbox</span>
      <span className="text-fg-muted font-medium">{n} items</span>
    </div>
  );
}
