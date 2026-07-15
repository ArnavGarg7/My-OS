"use client";

import { Workflow } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { PIPELINE_LABEL, STATUS_BADGE, STATUS_LABEL } from "./orchestration-icons";
import type { OrchestrationRun } from "@myos/core/orchestration";

/**
 * Orchestration context panel (Sprint 3.5). Route-aware snapshot on /orchestration —
 * system readiness, runs today, recoveries/failures and the most recent runs.
 */
export function OrchestrationContextPanel() {
  const summary = trpc.orchestration.summary.useQuery();
  const history = trpc.orchestration.history.useQuery({ limit: 5 });
  const s = summary.data;
  const runs = (history.data ?? []) as OrchestrationRun[];

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Workflow size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Orchestration</Text>
      </span>

      {s ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant={s.systemReady ? "success" : "warning"}>
            {s.systemReady ? "System ready" : "Attention"}
          </Badge>
          <Badge size="sm" variant="neutral">
            {s.runsToday} today
          </Badge>
          {s.recoveriesToday > 0 ? (
            <Badge size="sm" variant="warning">
              {s.recoveriesToday} recovered
            </Badge>
          ) : null}
          {s.failuresToday > 0 ? (
            <Badge size="sm" variant="danger">
              {s.failuresToday} failed
            </Badge>
          ) : null}
        </div>
      ) : null}

      {runs.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Recent runs
          </Text>
          {runs.map((r) => (
            <span key={r.id} className="flex items-center justify-between gap-2">
              <Text variant="caption" tone="subtle">
                {PIPELINE_LABEL[r.pipeline]}
              </Text>
              <Badge size="sm" variant={STATUS_BADGE[r.status]}>
                {STATUS_LABEL[r.status]}
              </Badge>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
