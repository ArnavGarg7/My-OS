"use client";

import { Archive, Trash2 } from "lucide-react";
import { Button, Divider, Progress, SectionHeader, Text } from "@myos/ui";
import type { Project } from "@myos/core/project";
import { trpc } from "@/lib/trpc/client";
import { HealthIndicator } from "./HealthIndicator";
import { ProjectStatusIndicator } from "./ProjectStatusIndicator";
import { ProjectTimeline } from "./ProjectTimeline";
import { MilestoneList } from "./MilestoneList";
import { ObjectiveSection } from "./ObjectiveSection";
import { ForecastPanel } from "./ForecastPanel";
import { BurndownChart } from "./BurndownChart";
import { DependencyView } from "./DependencyView";
import type { useProject } from "./use-project";

/**
 * ProjectInspector (Sprint 2.8). The full detail surface for a selected project:
 * progress, health, timeline, milestones, objectives, forecast, burndown and
 * dependencies. Every analytic is derived server-side and fetched per project.
 */
export function ProjectInspector({
  project,
  controller,
}: {
  project: Project;
  controller: ReturnType<typeof useProject>;
}) {
  const progressQuery = trpc.project.progress.useQuery({ id: project.id });
  const healthQuery = trpc.project.health.useQuery({ id: project.id });
  const forecastQuery = trpc.project.forecast.useQuery({ id: project.id });
  const burndownQuery = trpc.project.burndown.useQuery({ id: project.id });

  const progress = progressQuery.data;
  const health = healthQuery.data;

  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Text variant="heading-m">{project.name}</Text>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => controller.archive(project.id)}>
              <Archive size={14} aria-hidden />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => controller.remove(project.id)}>
              <Trash2 size={14} aria-hidden />
            </Button>
          </div>
        </div>
        {project.description && (
          <Text variant="body-s" tone="subtle">
            {project.description}
          </Text>
        )}
        <div className="flex items-center gap-2">
          <ProjectStatusIndicator status={project.status} />
          {health && <HealthIndicator status={health.status} />}
        </div>
      </header>

      {progress && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Text variant="body-s" tone="subtle">
              Overall progress
            </Text>
            <Text variant="body-s" className="tabular-nums">
              {progress.overall}%
            </Text>
          </div>
          <Progress value={progress.overall} />
          <Text variant="caption" tone="subtle">
            {progress.completedTasks}/{progress.totalTasks} tasks · {progress.completedMilestones}/
            {progress.totalMilestones} milestones
          </Text>
        </section>
      )}

      {health && health.reasons.length > 0 && (
        <section className="flex flex-col gap-1">
          <SectionHeader title="Health" />
          {health.reasons.map((r) => (
            <Text key={r} variant="caption" tone="subtle">
              • {r}
            </Text>
          ))}
        </section>
      )}

      <Divider />

      <section className="flex flex-col gap-2">
        <SectionHeader title="Timeline" />
        <ProjectTimeline project={project} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Milestones" />
        <MilestoneList
          projectId={project.id}
          milestones={project.milestones}
          onCreate={controller.createMilestone}
          onComplete={controller.completeMilestone}
        />
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Objectives" />
        <ObjectiveSection
          projectId={project.id}
          objectives={project.objectives}
          onCreate={controller.createObjective}
          onUpdate={controller.updateObjective}
        />
      </section>

      {forecastQuery.data && (
        <section>
          <ForecastPanel forecast={forecastQuery.data} />
        </section>
      )}

      {burndownQuery.data && burndownQuery.data.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeader title="Burndown" />
          <BurndownChart points={burndownQuery.data} />
        </section>
      )}

      {project.dependencies.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeader title="Dependencies" />
          <DependencyView
            projectId={project.id}
            dependencies={project.dependencies.map((dependsOn) => ({
              projectId: project.id,
              dependsOn,
            }))}
            projects={controller.allProjects}
          />
        </section>
      )}
    </div>
  );
}
