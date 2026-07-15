"use client";

import { Badge, EmptyState, Text } from "@myos/ui";
import type { OrchestrationRun } from "@myos/core/orchestration";
import {
  OrchestrationIcon,
  PIPELINE_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
} from "./orchestration-icons";

/**
 * RunHistory (Sprint 3.5). The chronological list of orchestration runs — pipeline,
 * status, affected count and runtime. Selecting a run opens its inspector.
 */
export function RunHistory({
  runs,
  selectedId,
  onSelect,
}: {
  runs: OrchestrationRun[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (runs.length === 0) {
    return (
      <EmptyState
        icon={OrchestrationIcon}
        title="No runs yet"
        description="Run a pipeline to see cross-module orchestration in action."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {runs.map((run) => {
        const active = run.id === selectedId;
        return (
          <li key={run.id}>
            <button
              type="button"
              onClick={() => onSelect(run.id)}
              className={`w-full rounded-md border px-3 py-2 text-left transition ${
                active
                  ? "border-accent bg-surface-raised"
                  : "border-border-subtle hover:bg-surface-raised"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <Text variant="body-s">{PIPELINE_LABEL[run.pipeline]}</Text>
                <Badge size="sm" variant={STATUS_BADGE[run.status]}>
                  {STATUS_LABEL[run.status]}
                </Badge>
              </div>
              <Text variant="caption" tone="subtle">
                {run.affected.length} modules · {run.runtimeMs ?? 0}ms
                {run.recoveries > 0 ? ` · ${run.recoveries} recovered` : ""}
                {run.failures > 0 ? ` · ${run.failures} failed` : ""}
              </Text>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
