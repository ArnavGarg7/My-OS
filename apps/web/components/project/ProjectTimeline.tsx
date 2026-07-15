"use client";

import { Progress, Text } from "@myos/ui";
import { sortMilestones, type Project } from "@myos/core/project";

/**
 * ProjectTimeline (Sprint 2.8). A chronological milestone timeline for a single
 * project — ordering comes from the pure engine. The server timeline endpoint
 * supplies exact task-level progress; this view renders the milestone spine.
 */
export function ProjectTimeline({ project }: { project: Project }) {
  const milestones = sortMilestones(project.milestones);

  if (milestones.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Add milestones to see the project timeline.
      </Text>
    );
  }

  return (
    <ol className="border-border relative flex flex-col gap-4 border-l pl-4">
      {milestones.map((m) => (
        <li key={m.id} className="relative">
          <span
            className={`absolute -left-[1.35rem] top-1 size-2.5 rounded-full ${
              m.completed ? "bg-success" : "bg-accent"
            }`}
            aria-hidden
          />
          <Text variant="body-s" className={m.completed ? "line-through" : ""}>
            {m.title}
          </Text>
          <Text variant="caption" tone="subtle">
            {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "No date"}
          </Text>
          {m.completed && <Progress value={100} className="mt-1" />}
        </li>
      ))}
    </ol>
  );
}
