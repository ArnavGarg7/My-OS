"use client";

import { trpc } from "@/lib/trpc/client";
import { relativeTime } from "./timeline-icons";

/**
 * Status-bar timeline indicator (Sprint 2.13): "Timeline · Today N events ·
 * Latest 3m ago". Provider-driven via `timeline.counts`.
 */
export function TimelineStatusIndicator() {
  const counts = trpc.timeline.counts.useQuery(undefined, { refetchInterval: 60_000 });
  const c = counts.data;
  if (!c) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className="bg-accent size-1.5 rounded-full" />
      <span className="text-fg-subtle">Timeline</span>
      <span className="text-fg-muted font-medium">Today {c.todayCount}</span>
      {c.latestAt ? <span className="text-fg-muted">· {relativeTime(c.latestAt)}</span> : null}
    </div>
  );
}
