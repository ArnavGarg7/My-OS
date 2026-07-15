"use client";

import { statusLabel } from "@myos/core/tomorrow";
import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar Tomorrow indicator (Sprint 3.1): "Tomorrow · Ready · 3 Priorities ·
 * Draft". Provider-driven via tomorrow.counts.
 */
export function StudioStatusIndicator() {
  const counts = trpc.tomorrow.counts.useQuery(undefined, { refetchInterval: 120_000 });
  const c = counts.data;
  if (!c) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${c.ready ? "bg-success" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Tomorrow</span>
      <span className="text-fg-muted font-medium">{c.ready ? "Ready" : statusLabel(c.status)}</span>
      <span className="text-fg-muted">· {c.priorityCount} priorities</span>
    </div>
  );
}
