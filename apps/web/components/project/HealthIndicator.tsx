"use client";

import { cn } from "@myos/ui";
import type { ProjectHealth } from "@myos/core/project";
import { HEALTH_DOT, HEALTH_LABEL, HEALTH_TONE } from "./project-icons";

/**
 * HealthIndicator (Sprint 2.8). A small dot + label for a project's derived
 * health status. Presentational only — the status comes from the health engine.
 */
export function HealthIndicator({
  status,
  showLabel = true,
  className,
}: {
  status: ProjectHealth;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("size-2 rounded-full", HEALTH_DOT[status])} aria-hidden />
      {showLabel && (
        <span className={cn("text-xs font-medium", HEALTH_TONE[status])}>
          {HEALTH_LABEL[status]}
        </span>
      )}
    </span>
  );
}
