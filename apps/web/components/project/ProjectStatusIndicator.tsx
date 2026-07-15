"use client";

import { Badge } from "@myos/ui";
import type { ProjectStatus } from "@myos/core/project";
import { STATUS_LABEL } from "./project-icons";

const VARIANT: Record<ProjectStatus, "neutral" | "accent" | "success" | "warning"> = {
  planning: "neutral",
  active: "accent",
  on_hold: "warning",
  completed: "success",
  archived: "neutral",
};

/** A status badge for a project (Sprint 2.8). Presentational only. */
export function ProjectStatusIndicator({ status }: { status: ProjectStatus }) {
  return (
    <Badge size="sm" variant={VARIANT[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
