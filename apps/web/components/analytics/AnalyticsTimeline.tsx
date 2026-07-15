"use client";

import type { ReportType } from "@myos/core/analytics";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { BarSeries, MetricBar } from "./AnalyticsCharts";

/**
 * AnalyticsTimeline (Sprint 2.14). Activity distribution derived from the
 * Timeline via analytics.timeline — event volume by source + peak day. Analytics
 * never recomputes; it reads the Timeline aggregate.
 */
export function AnalyticsTimeline({ period }: { period: ReportType }) {
  const q = trpc.analytics.timeline.useQuery({ type: period });
  const t = q.data;
  if (!t) return null;
  const bars = Object.entries(t.bySource)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  return (
    <div className="flex flex-col gap-3">
      <MetricBar label="Total events" value={t.totalEvents} />
      <MetricBar label="Daily average" value={t.dailyAverage} />
      <MetricBar label="Active days" value={t.activeDays} />
      {t.peakDay ? (
        <Text variant="caption" tone="subtle">
          Peak day: {t.peakDay.date} ({t.peakDay.count} events)
        </Text>
      ) : null}
      <div>
        <Text variant="label" tone="subtle">
          By source
        </Text>
        <BarSeries data={bars} ariaLabel="events by source" />
      </div>
    </div>
  );
}
