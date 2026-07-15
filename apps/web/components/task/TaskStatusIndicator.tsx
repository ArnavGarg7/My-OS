"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar task indicator (Sprint 2.5): "Tasks · N Open · N Scheduled ·
 * N Overdue". Provider-driven via the counts query.
 */
export function TaskStatusIndicator() {
  const counts = trpc.task.counts.useQuery(undefined, { refetchInterval: 60_000 });
  const c = counts.data ?? { open: 0, scheduled: 0, overdue: 0, completed: 0 };

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${c.overdue > 0 ? "bg-danger" : c.open > 0 ? "bg-accent" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Tasks</span>
      <span className="text-fg-muted font-medium">{c.open} open</span>
      {c.overdue > 0 ? <span className="text-danger font-medium">{c.overdue} overdue</span> : null}
    </div>
  );
}
