"use client";

import { Timer } from "lucide-react";
import { StatBlock, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { formatMinutes } from "./format";

/**
 * FocusReviewStats (Sprint 3.2). Surfaces today's focus outcomes inside the Tomorrow
 * Studio evening review — completed vs interrupted sessions, deep work and planner
 * accuracy. Read-only; derived from focus sessions.
 */
export function FocusReviewStats() {
  const metrics = trpc.focus.metrics.useQuery();
  const m = metrics.data;
  if (!m || m.totalSessions === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5">
        <Timer size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
          Focus today
        </Text>
      </span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Completed" value={String(m.completedSessions)} />
        <StatBlock label="Interruptions" value={String(m.interruptions)} />
        <StatBlock label="Deep work" value={formatMinutes(m.deepWorkMinutes)} />
        <StatBlock label="Planner acc." value={`${m.plannerAccuracy}%`} />
      </div>
    </div>
  );
}
