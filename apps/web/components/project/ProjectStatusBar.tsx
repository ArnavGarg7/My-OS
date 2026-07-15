"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar project indicator (Sprint 2.8): "Projects · 8 Active · 74% · 2 At
 * Risk". Provider-driven via the portfolio query. Live, refetched each minute.
 */
export function ProjectStatusBar() {
  const portfolio = trpc.project.portfolio.useQuery(undefined, { refetchInterval: 60_000 });
  const p = portfolio.data;
  if (!p || p.projectCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${p.atRiskCount > 0 ? "bg-warning" : "bg-success"}`}
      />
      <span className="text-fg-subtle">Projects</span>
      <span className="text-fg-muted font-medium">{p.activeCount} Active</span>
      <span className="text-fg-muted">· {p.overallCompletion}%</span>
      {p.atRiskCount > 0 ? <span className="text-fg-muted">· {p.atRiskCount} At Risk</span> : null}
    </div>
  );
}
