"use client";

import { trpc } from "@/lib/trpc/client";
import { formatMoney } from "./resource-icons";

/**
 * Status-bar resource indicator (Sprint 4.3): "Resources · ₹5,60,000 · 2 renewals · 1
 * birthday". Provider-driven via resource.summary, which recomputes the portfolio on each
 * poll rather than reading a cached total.
 */
export function ResourceStatusIndicator() {
  const summary = trpc.resource.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const s = summary.data;
  if (!s) return null;

  const needsAttention =
    s.upcomingRenewals > 0 || s.maintenanceOverdue > 0 || s.documentsExpiring > 0;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${needsAttention ? "bg-warning" : "bg-success"}`}
      />
      <span className="text-fg-subtle">Resources</span>
      <span className="text-fg-muted font-medium">{formatMoney(s.netWorth)}</span>
      {s.upcomingRenewals > 0 ? (
        <span className="text-fg-muted">
          · {s.upcomingRenewals} renewal{s.upcomingRenewals === 1 ? "" : "s"}
        </span>
      ) : null}
      {s.maintenanceOverdue > 0 ? (
        <span className="text-warning">· {s.maintenanceOverdue} overdue</span>
      ) : null}
      {s.nextBirthday ? <span className="text-accent">· 🎂 {s.nextBirthday}</span> : null}
      {s.followUpsDue > 0 ? (
        <span className="text-fg-muted">· {s.followUpsDue} follow-up</span>
      ) : null}
    </div>
  );
}
