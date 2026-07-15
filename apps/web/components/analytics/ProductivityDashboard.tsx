"use client";

import type { ReportType } from "@myos/core/analytics";
import { trpc } from "@/lib/trpc/client";
import { MetricBar, ScoreTile } from "./AnalyticsCharts";

/** ProductivityDashboard (Sprint 2.14). Deterministic productivity metrics. */
export function ProductivityDashboard({ period }: { period: ReportType }) {
  const q = trpc.analytics.productivity.useQuery({ type: period });
  const p = q.data;
  if (!p) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScoreTile label="Productivity score" score={p.score} />
      <MetricBar label="Tasks completed" value={p.tasksCompleted} />
      <MetricBar label="Deep work" value={p.deepWorkMinutes} suffix="min" />
      <MetricBar
        label="Planner completion"
        value={`${p.plannerCompletion}%`}
        percent={p.plannerCompletion}
      />
      <MetricBar label="Decisions completed" value={p.decisionsCompleted} />
      <MetricBar label="Context switches" value={p.contextSwitches} />
    </div>
  );
}
