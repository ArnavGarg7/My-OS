"use client";

import type { ReportType } from "@myos/core/analytics";
import { trpc } from "@/lib/trpc/client";
import { MetricBar, ScoreTile } from "./AnalyticsCharts";

/** FocusDashboard (Sprint 2.14). Deep-work volume, blocks + continuity. */
export function FocusDashboard({ period }: { period: ReportType }) {
  const q = trpc.analytics.focus.useQuery({ type: period });
  const f = q.data;
  if (!f) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScoreTile label="Focus score" score={f.score} />
      <MetricBar label="Deep work" value={f.deepWorkMinutes} suffix="min" />
      <MetricBar label="Focus blocks" value={f.focusBlocks} />
      <MetricBar label="Longest block" value={f.longestBlockMinutes} suffix="min" />
      <MetricBar label="Context switches" value={f.contextSwitches} />
    </div>
  );
}
