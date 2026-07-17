"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar life indicator (Sprint 4.2): "Life · 3/5 habits · readiness 78". Provider-
 * driven via life.summary.
 */
export function LifeStatusIndicator() {
  const summary = trpc.life.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${s.readiness >= 60 ? "bg-success" : "bg-warning"}`}
      />
      <span className="text-fg-subtle">Life</span>
      <span className="text-fg-muted font-medium">
        {s.habitsCompletedToday}/{s.activeHabits} habits
      </span>
      <span className="text-fg-muted">· readiness {s.readiness}</span>
      {s.medicationDue ? <span className="text-warning">· meds due</span> : null}
    </div>
  );
}
