"use client";

import { StatBlock, Text } from "@myos/ui";
import { ALL_HEALTH, type PortfolioSummary } from "@myos/core/project";
import { HEALTH_LABEL } from "./project-icons";
import { HealthIndicator } from "./HealthIndicator";

/**
 * PortfolioOverview (Sprint 2.8). Headline portfolio metrics — completion,
 * health distribution, open milestones, blocked work and upcoming deadlines.
 * Equal weighting across projects.
 */
export function PortfolioOverview({ summary }: { summary: PortfolioSummary }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Projects" value={String(summary.projectCount)} />
        <StatBlock label="Active" value={String(summary.activeCount)} />
        <StatBlock label="Completion" value={`${summary.overallCompletion}%`} />
        <StatBlock label="At risk" value={String(summary.atRiskCount)} />
      </div>

      <div className="flex flex-col gap-2">
        <Text variant="heading-s">Health</Text>
        <div className="flex flex-wrap gap-3">
          {ALL_HEALTH.map((h) => (
            <span key={h} className="inline-flex items-center gap-1.5">
              <HealthIndicator status={h} showLabel={false} />
              <Text variant="caption" tone="subtle">
                {HEALTH_LABEL[h]} · {summary.healthDistribution[h]}
              </Text>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBlock label="Open milestones" value={String(summary.openMilestones)} />
        <StatBlock label="Blocked tasks" value={String(summary.blockedTasks)} />
      </div>

      {summary.upcomingDeadlines.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Text variant="heading-s">Upcoming deadlines</Text>
          {summary.upcomingDeadlines.slice(0, 5).map((d) => (
            <div
              key={`${d.projectId}-${d.dueDate}-${d.title}`}
              className="flex justify-between gap-2"
            >
              <Text variant="body-s" className="truncate">
                {d.title}
              </Text>
              <Text variant="caption" tone="subtle">
                {new Date(d.dueDate).toLocaleDateString()}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
