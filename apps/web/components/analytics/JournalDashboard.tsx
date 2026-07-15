"use client";

import type { ReportType } from "@myos/core/analytics";
import { trpc } from "@/lib/trpc/client";
import { MetricBar, ScoreTile } from "./AnalyticsCharts";

/** JournalDashboard (Sprint 2.14). Writing consistency + mood trend. */
export function JournalDashboard({ period }: { period: ReportType }) {
  const q = trpc.analytics.journal.useQuery({ type: period });
  const j = q.data;
  if (!j) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScoreTile label="Journal score" score={j.score} />
      <MetricBar label="Writing streak" value={j.writingStreak} suffix="days" />
      <MetricBar label="Entries" value={j.entries} />
      <MetricBar
        label="Reflection consistency"
        value={`${j.reflectionConsistency}%`}
        percent={j.reflectionConsistency}
      />
      <MetricBar label="Mood trend" value={`${j.moodTrend}/5`} />
      <MetricBar label="Gratitude logged" value={j.gratitudeCount} />
    </div>
  );
}
