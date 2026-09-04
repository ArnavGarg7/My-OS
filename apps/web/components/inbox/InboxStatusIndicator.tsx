"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar inbox indicator (Sprint 2.4): "Inbox · N items". Links to the
 * inbox. Reflects the count of unprocessed captures.
 */
export function InboxStatusIndicator() {
  const count = trpc.inbox.countNew.useQuery(undefined, { refetchInterval: 60_000 });
  const n = count.data ?? 0;

  return (
    <Link
      href="/inbox"
      className="hover:text-fg focus-visible:ring-ring flex items-center gap-1.5 rounded-sm outline-none transition-colors focus-visible:ring-1"
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${n > 0 ? "bg-accent" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Inbox</span>
      <span className="text-fg-muted font-medium">{n === 0 ? "empty" : `${n} items`}</span>
    </Link>
  );
}
