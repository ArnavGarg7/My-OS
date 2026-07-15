"use client";

import { Progress, Text } from "@myos/ui";
import { nextMilestone } from "@myos/core/project";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { HealthIndicator } from "./HealthIndicator";
import { META_ICONS } from "./project-icons";

/**
 * ProjectContextPanel (Sprint 2.8). Route-aware right-panel content for the
 * selected project: completion, health, next milestone, forecast + velocity.
 */
export function ProjectContextPanel() {
  const selectedId = useShellStore((s) => s.selectedProjectId);

  const projectQuery = trpc.project.get.useQuery(
    { id: selectedId ?? "" },
    { enabled: !!selectedId },
  );
  const summaryQuery = trpc.project.summary.useQuery(
    { id: selectedId ?? "" },
    { enabled: !!selectedId },
  );

  if (!selectedId || !projectQuery.data) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <Text variant="body-s" tone="subtle">
          Select a project to see its health, milestones and forecast.
        </Text>
      </div>
    );
  }

  const project = projectQuery.data;
  const summary = summaryQuery.data;
  const next = nextMilestone(project.milestones, new Date());
  const Deadline = META_ICONS.deadline;
  const Forecast = META_ICONS.forecast;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <Text variant="heading-s">{project.name}</Text>
        {summary && <HealthIndicator status={summary.health.status} />}
      </div>

      {summary && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Text variant="body-s" tone="subtle">
              Completion
            </Text>
            <Text variant="body-s" className="tabular-nums">
              {summary.progress.overall}%
            </Text>
          </div>
          <Progress value={summary.progress.overall} />
        </div>
      )}

      {next && (
        <div className="flex items-center gap-2">
          <Deadline size={14} aria-hidden className="text-fg-subtle" />
          <div>
            <Text variant="body-s">{next.title}</Text>
            <Text variant="caption" tone="subtle">
              Next milestone
              {next.dueDate ? ` · ${new Date(next.dueDate).toLocaleDateString()}` : ""}
            </Text>
          </div>
        </div>
      )}

      {summary && (
        <div className="flex items-center gap-2">
          <Forecast size={14} aria-hidden className="text-fg-subtle" />
          <div>
            <Text variant="body-s">
              {summary.forecast.onTrack
                ? "On track"
                : `~${summary.forecast.predictedDelayDays}d behind`}
            </Text>
            <Text variant="caption" tone="subtle">
              {summary.forecast.velocityPerDay}/day · {summary.forecast.remainingTasks} left
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
