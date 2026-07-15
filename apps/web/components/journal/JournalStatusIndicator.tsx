"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar journal indicator (Sprint 2.10): "Journal · Today ✓ · 5-day
 * streak". Provider-driven via the summary query.
 */
export function JournalStatusIndicator() {
  const summary = trpc.journal.summary.useQuery({}, { refetchInterval: 120_000 });
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${s.todaysEntries > 0 ? "bg-success" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Journal</span>
      <span className="text-fg-muted font-medium">
        {s.todaysEntries > 0 ? "Today ✓" : "No entry"}
      </span>
      {s.streak.current > 0 ? (
        <span className="text-fg-muted">· {s.streak.current}-day streak</span>
      ) : null}
    </div>
  );
}
