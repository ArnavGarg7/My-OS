"use client";

import type { ReportType } from "@myos/core/analytics";
import { Badge } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { MetricBar } from "./AnalyticsCharts";

const TREND_VARIANT = { improving: "success", flat: "neutral", worsening: "warning" } as const;

/** ProjectDashboard (Sprint 2.14). Completion throughput + burndown trend. */
export function ProjectDashboard({ period }: { period: ReportType }) {
  const q = trpc.analytics.projects.useQuery({ type: period });
  const p = q.data;
  if (!p) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <MetricBar label="Burndown" value="" />
        <Badge size="sm" variant={TREND_VARIANT[p.burndownTrend]} className="capitalize">
          {p.burndownTrend}
        </Badge>
      </div>
      <MetricBar label="Projects completed" value={p.projectsCompleted} />
      <MetricBar label="Milestones completed" value={p.milestonesCompleted} />
      <MetricBar label="At risk" value={p.atRisk} />
      <MetricBar label="Velocity" value={p.velocity} suffix="tasks/wk" />
    </div>
  );
}
