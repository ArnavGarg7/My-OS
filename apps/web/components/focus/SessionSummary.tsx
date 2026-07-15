"use client";

import { StatBlock, Text } from "@myos/ui";
import type { FocusMetrics } from "@myos/core/focus";
import { formatMinutes } from "./format";

/**
 * SessionSummary (Sprint 3.2). The day's derived focus metrics — always computed from
 * sessions, never stored. Deep work, focus %, interruptions, completion, planner
 * accuracy, recovered time.
 */
export function SessionSummary({ metrics }: { metrics: FocusMetrics }) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Today's focus
      </Text>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBlock label="Deep work" value={formatMinutes(metrics.deepWorkMinutes)} />
        <StatBlock label="Focus %" value={`${metrics.focusPercent}%`} />
        <StatBlock label="Interruptions" value={String(metrics.interruptions)} />
        <StatBlock label="Longest" value={formatMinutes(metrics.longestSessionMinutes)} />
        <StatBlock label="Completion" value={`${metrics.completionRate}%`} />
        <StatBlock label="Planner acc." value={`${metrics.plannerAccuracy}%`} />
        <StatBlock label="Shallow" value={formatMinutes(metrics.shallowMinutes)} />
        <StatBlock label="Breaks" value={formatMinutes(metrics.breakMinutes)} />
        <StatBlock label="Recovered" value={formatMinutes(metrics.recoveredMinutes)} />
      </div>
    </div>
  );
}
