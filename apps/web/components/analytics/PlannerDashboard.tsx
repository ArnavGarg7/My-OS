"use client";

import { trpc } from "@/lib/trpc/client";
import { MetricBar, ScoreTile } from "./AnalyticsCharts";

/** PlannerDashboard (Sprint 2.14). Planner adherence + block throughput. */
export function PlannerDashboard() {
  const q = trpc.analytics.planner.useQuery();
  const p = q.data;
  if (!p) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScoreTile label="Planner accuracy" score={p.accuracy} />
      <MetricBar
        label="Completion rate"
        value={`${p.completionRate}%`}
        percent={p.completionRate}
      />
      <MetricBar label="Blocks completed" value={`${p.blocksCompleted}/${p.blocksTotal}`} />
      <MetricBar label="Utilisation" value={`${p.utilization}%`} percent={p.utilization} />
      <MetricBar label="Regenerations" value={p.regenerations} />
      <MetricBar label="Overflow" value={p.overflow} />
    </div>
  );
}
