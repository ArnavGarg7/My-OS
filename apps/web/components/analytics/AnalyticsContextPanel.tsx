"use client";

import { BarChart3 } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { ScoreTile, TrendBadge } from "./AnalyticsCharts";

/**
 * Analytics context panel (Sprint 2.14). Shows the composite scoreboard, the
 * weekly trend and the headline stats — the "selected metric" breakdown for the
 * unified inspector.
 */
export function AnalyticsContextPanel() {
  const dashboard = trpc.analytics.dashboard.useQuery();
  const stats = trpc.analytics.statistics.useQuery({ type: "weekly" });
  const d = dashboard.data;

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <BarChart3 size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Analytics</Text>
      </span>

      {d ? (
        <>
          <div className="flex items-center justify-between">
            <Text variant="body-s" tone="subtle">
              This week
            </Text>
            <TrendBadge direction={d.trend.direction} changePercent={d.trend.changePercent} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ScoreTile label="Overall" score={d.scores.overall} />
            <ScoreTile label="Productivity" score={d.scores.productivity} />
            <ScoreTile label="Focus" score={d.scores.focus} />
            <ScoreTile label="Health" score={d.scores.health} />
            <ScoreTile label="Goals" score={d.scores.goals} />
            <ScoreTile label="Finance" score={d.scores.finance} />
          </div>
        </>
      ) : (
        <Text variant="body-s" tone="subtle">
          Your metrics appear here as activity accumulates.
        </Text>
      )}

      {stats.data ? (
        <Text variant="caption" tone="subtle">
          {stats.data.totalEvents} events · {stats.data.activeDays} active days · ~
          {stats.data.averageEventsPerDay}/day
        </Text>
      ) : null}
    </div>
  );
}
