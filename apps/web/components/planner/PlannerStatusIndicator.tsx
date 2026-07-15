"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar planner indicator (Sprint 2.6): "Planner · Generated · 84% ·
 * Next 09:30". Provider-driven via the summary query.
 */
export function PlannerStatusIndicator() {
  const summary = trpc.planner.summary.useQuery({}, { refetchInterval: 60_000 });
  const s = summary.data;
  const generated = s && s.day.status !== "empty";

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${s && s.conflicts > 0 ? "bg-warning" : generated ? "bg-success" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Planner</span>
      <span className="text-fg-muted font-medium capitalize">
        {generated ? s!.day.status : "empty"}
      </span>
      {generated ? (
        <span className="text-fg-muted font-medium">{s!.utilization.percentUtilized}%</span>
      ) : null}
    </div>
  );
}
