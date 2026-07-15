"use client";

import { BarChart3, Flame, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing analytics slot (Sprint 2.14). Editorial, read-only: yesterday's
 * productivity, the weekly trend, current streak + goal velocity — all derived
 * server-side. Analytics owns no data; it reads the existing engines.
 */
export function MorningAnalyticsSection() {
  const dashboard = trpc.analytics.dashboard.useQuery();
  const goals = trpc.analytics.goals.useQuery({ type: "weekly" });
  const timeline = trpc.timeline.highlights.useQuery({});

  const d = dashboard.data;
  if (!d) {
    return (
      <Text variant="body-s" tone="subtle">
        Your metrics appear here as activity accumulates.
      </Text>
    );
  }

  const TrendIcon = d.trend.direction === "down" ? TrendingDown : TrendingUp;
  const streak = timeline.data?.find((h) => h.category === "largest_journal_streak");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          Productivity {d.productivity} · Overall {d.scores.overall}
        </Text>
      </div>

      <div className="flex items-center gap-2">
        <TrendIcon
          size={15}
          aria-hidden
          className={d.trend.direction === "down" ? "text-danger" : "text-success"}
        />
        <Text variant="body-s">
          Weekly trend {d.trend.changePercent > 0 ? "+" : ""}
          {Math.round(d.trend.changePercent * 10) / 10}%
        </Text>
      </div>

      {goals.data ? (
        <div className="flex items-center gap-2">
          <Target size={15} aria-hidden className="text-fg-subtle" />
          <Text variant="body-s">Goal velocity {goals.data.velocity}/wk</Text>
        </div>
      ) : null}

      {streak ? (
        <div className="flex items-center gap-2">
          <Flame size={15} aria-hidden className="text-warning" />
          <Text variant="body-s">{streak.title}</Text>
        </div>
      ) : null}
    </div>
  );
}
