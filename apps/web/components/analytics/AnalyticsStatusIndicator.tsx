"use client";

import { trpc } from "@/lib/trpc/client";
import { formatSigned, scoreDot } from "./analytics-icons";

/**
 * Status-bar analytics indicator (Sprint 2.14): "Analytics · Productivity 82 ·
 * ↑6%". Provider-driven via analytics.statusSignal.
 */
export function AnalyticsStatusIndicator() {
  const q = trpc.analytics.statusSignal.useQuery(undefined, { refetchInterval: 120_000 });
  const s = q.data;
  if (!s) return null;
  const arrow = s.trendDirection === "up" ? "↑" : s.trendDirection === "down" ? "↓" : "→";

  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className={`size-1.5 rounded-full ${scoreDot(s.overall)}`} />
      <span className="text-fg-subtle">Analytics</span>
      <span className="text-fg-muted font-medium">Productivity {s.productivity}</span>
      <span className="text-fg-muted">
        · {arrow} {formatSigned(s.trendPercent).replace("+", "").replace("%", "")}%
      </span>
    </div>
  );
}
