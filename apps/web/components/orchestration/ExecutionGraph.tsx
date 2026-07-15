"use client";

import { ArrowRight } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import type { ExecutionStep, OrchestrationModule } from "@myos/core/orchestration";
import { MODE_LABEL, MODULE_ICON, MODULE_LABEL } from "./orchestration-icons";

/**
 * ExecutionGraph (Sprint 3.5). Renders a plan's ordered module chain — the exact,
 * deterministic execution order — as a readable left-to-right flow. Skipped modules are
 * dimmed. Editorial, not an interactive node editor.
 */
export function ExecutionGraph({
  steps,
  skipped = [],
}: {
  steps: ExecutionStep[];
  skipped?: OrchestrationModule[];
}) {
  const skip = new Set(skipped);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => {
        const Icon = MODULE_ICON[step.module];
        const isSkipped = skip.has(step.module);
        return (
          <div key={`${step.module}-${i}`} className="flex items-center gap-1.5">
            <div
              className={`border-border-subtle flex items-center gap-1.5 rounded-md border px-2 py-1 ${
                isSkipped ? "opacity-40" : ""
              }`}
              title={`${MODULE_LABEL[step.module]} — ${MODE_LABEL[step.mode]}`}
            >
              <Icon size={13} aria-hidden />
              <Text variant="caption">{MODULE_LABEL[step.module]}</Text>
              <Badge size="sm" variant={step.mode === "regenerate" ? "accent" : "neutral"}>
                {MODE_LABEL[step.mode]}
              </Badge>
            </div>
            {i < steps.length - 1 ? (
              <ArrowRight size={13} aria-hidden className="text-fg-subtle" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
