"use client";

import type { ReportType } from "@myos/core/analytics";
import { trpc } from "@/lib/trpc/client";
import { MetricBar } from "./AnalyticsCharts";

/** CalendarDashboard (Sprint 2.14). Meeting vs focus vs free time. */
export function CalendarDashboard({ period }: { period: ReportType }) {
  const q = trpc.analytics.calendar.useQuery({ type: period });
  const c = q.data;
  if (!c) return null;
  return (
    <div className="flex flex-col gap-3">
      <MetricBar label="Meeting hours" value={c.meetingHours} suffix="h" />
      <MetricBar label="Focus hours" value={c.focusHours} suffix="h" />
      <MetricBar label="Free hours" value={c.freeHours} suffix="h" />
      <MetricBar label="Meeting ratio" value={`${c.meetingRatio}%`} percent={c.meetingRatio} />
      <MetricBar label="Utilisation" value={`${c.utilization}%`} percent={c.utilization} />
      <MetricBar label="Longest block" value={c.longestUninterruptedMinutes} suffix="min" />
    </div>
  );
}
