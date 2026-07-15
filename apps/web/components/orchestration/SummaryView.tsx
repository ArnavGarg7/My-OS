"use client";

import { Badge, StatBlock, Text } from "@myos/ui";
import type { OrchestrationSummary } from "@myos/core/orchestration";

/**
 * SummaryView (Sprint 3.5). The compact system-health panel: is the OS orchestrating
 * cleanly right now, how many runs today, and any failures/recoveries. Derived only.
 */
export function SummaryView({ summary }: { summary: OrchestrationSummary }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Text variant="heading-s">System status</Text>
        <Badge size="sm" variant={summary.systemReady ? "success" : "warning"}>
          {summary.systemReady ? "System ready" : "Attention needed"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Runs today" value={String(summary.runsToday)} />
        <StatBlock label="Recovered" value={String(summary.recoveriesToday)} />
        <StatBlock label="Failed" value={String(summary.failuresToday)} />
        <StatBlock label="Last run modules" value={String(summary.affectedModulesLastRun)} />
      </div>
    </div>
  );
}
