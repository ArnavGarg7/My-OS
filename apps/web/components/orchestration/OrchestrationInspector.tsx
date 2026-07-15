"use client";

import { Badge, Text } from "@myos/ui";
import type { OrchestrationRun } from "@myos/core/orchestration";
import {
  MODE_LABEL,
  MODULE_ICON,
  MODULE_LABEL,
  OUTCOME_ICON,
  PIPELINE_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
  STRATEGY_LABEL,
} from "./orchestration-icons";

/**
 * OrchestrationInspector (Sprint 3.5). The editorial detail of a selected run: pipeline,
 * status, summary and every step's outcome in execution order, including the recovery
 * strategy applied to any failed step.
 */
export function OrchestrationInspector({ run }: { run: OrchestrationRun }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="heading-s">{PIPELINE_LABEL[run.pipeline]}</Text>
        <Badge size="sm" variant={STATUS_BADGE[run.status]}>
          {STATUS_LABEL[run.status]}
        </Badge>
      </div>
      <Text variant="body-s" tone="subtle">
        {run.summary}
      </Text>
      <div className="text-fg-subtle flex flex-wrap gap-3 text-xs">
        <span>{run.affected.length} modules</span>
        <span>{run.runtimeMs ?? 0}ms</span>
        {run.recoveries > 0 ? <span>{run.recoveries} recovered</span> : null}
        {run.failures > 0 ? <span>{run.failures} failed</span> : null}
      </div>

      <ul className="flex flex-col gap-1">
        {run.steps.map((step, i) => {
          const Icon = MODULE_ICON[step.module];
          const OutcomeIcon = OUTCOME_ICON[step.outcome];
          return (
            <li
              key={`${step.module}-${i}`}
              className="border-border-subtle flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
                <Icon size={13} aria-hidden />
                <Text variant="body-s">{MODULE_LABEL[step.module]}</Text>
                <Badge size="sm" variant="neutral">
                  {MODE_LABEL[step.mode]}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                {step.recovery ? (
                  <Badge size="sm" variant="warning">
                    {STRATEGY_LABEL[step.recovery]}
                  </Badge>
                ) : null}
                {OutcomeIcon ? <OutcomeIcon size={14} aria-hidden /> : null}
                <Text variant="caption" tone="subtle">
                  {step.outcome}
                </Text>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
