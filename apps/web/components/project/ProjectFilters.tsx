"use client";

import { Chip } from "@myos/ui";
import { PROJECT_STATUSES, type ProjectStatus } from "@myos/core/project";
import { STATUS_LABEL } from "./project-icons";

/**
 * ProjectFilters (Sprint 2.8). Status filter chips. Selecting the active chip
 * again clears the filter. Sorting lives in the toolbar.
 */
export function ProjectFilters({
  value,
  onChange,
}: {
  value: ProjectStatus | null;
  onChange: (status: ProjectStatus | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PROJECT_STATUSES.map((status) => (
        <Chip
          key={status}
          selected={value === status}
          onClick={() => onChange(value === status ? null : status)}
        >
          {STATUS_LABEL[status]}
        </Chip>
      ))}
    </div>
  );
}
