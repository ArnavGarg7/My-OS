"use client";

import type { ReportType } from "@myos/core/analytics";
import { trpc } from "@/lib/trpc/client";
import { MetricBar, ScoreTile } from "./AnalyticsCharts";

/** GoalDashboard (Sprint 2.14). Goal velocity + progress + habit consistency. */
export function GoalDashboard({ period }: { period: ReportType }) {
  const q = trpc.analytics.goals.useQuery({ type: period });
  const g = q.data;
  if (!g) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScoreTile label="Goal score" score={g.score} />
      <MetricBar
        label="Overall progress"
        value={`${g.overallProgress}%`}
        percent={g.overallProgress}
      />
      <MetricBar label="Velocity" value={g.velocity} suffix="/wk" />
      <MetricBar
        label="Habit consistency"
        value={`${g.habitConsistency}%`}
        percent={g.habitConsistency}
      />
      <MetricBar label="Objectives completed" value={g.objectivesCompleted} />
      <MetricBar label="Active goals" value={g.activeCount} />
    </div>
  );
}
