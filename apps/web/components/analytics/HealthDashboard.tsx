"use client";

import { trpc } from "@/lib/trpc/client";
import { MetricBar, ScoreTile } from "./AnalyticsCharts";

/** HealthDashboard (Sprint 2.14). Wellness score from the Health engine. */
export function HealthDashboard() {
  const q = trpc.analytics.health.useQuery();
  const h = q.data;
  if (!h) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScoreTile label="Health score" score={h.score} />
      <MetricBar label="Avg readiness" value={`${h.avgReadiness}%`} percent={h.avgReadiness} />
      <MetricBar
        label="Avg sleep"
        value={`${Math.floor(h.avgSleepMinutes / 60)}h ${h.avgSleepMinutes % 60}m`}
      />
      <MetricBar
        label="Hydration"
        value={`${h.avgHydrationPercent}%`}
        percent={h.avgHydrationPercent}
      />
      <MetricBar label="Recovery" value={`${h.recoveryScore}%`} percent={h.recoveryScore} />
      <MetricBar
        label="Workout consistency"
        value={`${h.workoutConsistency}%`}
        percent={h.workoutConsistency}
      />
    </div>
  );
}
