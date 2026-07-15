"use client";

import { Workflow } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Tomorrow Studio orchestration readiness (Sprint 3.5). A closing system-health check
 * before finalizing tomorrow: System Ready, Pipelines Pending or Recovery Required, so
 * you close the day knowing every engine is in sync. Read-only.
 */
export function TomorrowOrchestration() {
  const summary = trpc.orchestration.summary.useQuery();
  const s = summary.data;
  if (!s) return null;

  const label = !s.systemReady
    ? "Recovery required"
    : s.recoveriesToday > 0
      ? "Recovered today"
      : "System ready";
  const variant = !s.systemReady ? "danger" : s.recoveriesToday > 0 ? "warning" : "success";

  return (
    <div className="border-border-subtle flex items-center justify-between gap-2 rounded-md border px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <Workflow size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s">Cross-module system</Text>
      </span>
      <div className="flex items-center gap-1.5">
        <Badge size="sm" variant={variant}>
          {label}
        </Badge>
        <Text variant="caption" tone="subtle">
          {s.runsToday} run{s.runsToday === 1 ? "" : "s"} today
        </Text>
      </div>
    </div>
  );
}
