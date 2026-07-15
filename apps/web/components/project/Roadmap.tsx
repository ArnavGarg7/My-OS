"use client";

import { Map as MapIcon } from "lucide-react";
import { EmptyState, Text } from "@myos/ui";
import { buildRoadmap, groupByQuarter, type Project } from "@myos/core/project";

/**
 * Roadmap (Sprint 2.8). Groups every project's milestones into a quarter → month
 * view. Deterministic; the Planner never computes roadmap views.
 */
export function Roadmap({ projects }: { projects: Project[] }) {
  const items = buildRoadmap(projects);
  const byQuarter = groupByQuarter(items);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={MapIcon}
        title="No roadmap yet"
        description="Add dated milestones to your projects to build a roadmap."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {[...byQuarter.entries()].map(([quarter, quarterItems]) => (
        <section key={quarter} className="flex flex-col gap-2">
          <Text variant="heading-s">{quarter}</Text>
          <ul className="flex flex-col gap-1.5">
            {quarterItems.map((item) => (
              <li
                key={item.milestoneId}
                className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <Text variant="body-s" className={item.completed ? "line-through" : ""}>
                    {item.title}
                  </Text>
                  <Text variant="caption" tone="subtle" className="truncate">
                    {item.projectName}
                  </Text>
                </div>
                <Text variant="caption" tone="subtle">
                  {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
