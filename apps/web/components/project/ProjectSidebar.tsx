"use client";

import { Text } from "@myos/ui";
import type { useProject } from "./use-project";
import { ProjectFilters } from "./ProjectFilters";
import { PortfolioOverview } from "./PortfolioOverview";

/**
 * ProjectSidebar (Sprint 2.8). Filters + a compact portfolio snapshot alongside
 * the project list.
 */
export function ProjectSidebar({ controller }: { controller: ReturnType<typeof useProject> }) {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-2">
        <Text variant="heading-s">Filter</Text>
        <ProjectFilters value={controller.statusFilter} onChange={controller.setStatusFilter} />
      </div>
      {controller.portfolio && (
        <div className="flex flex-col gap-2">
          <Text variant="heading-s">Portfolio</Text>
          <PortfolioOverview summary={controller.portfolio} />
        </div>
      )}
    </div>
  );
}
