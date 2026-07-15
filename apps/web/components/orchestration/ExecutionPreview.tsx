"use client";

import { Badge, Card, Text } from "@myos/ui";
import type { ExecutionPlan } from "@myos/core/orchestration";
import { ExecutionGraph } from "./ExecutionGraph";
import { MODULE_LABEL, PIPELINE_LABEL } from "./orchestration-icons";

/**
 * ExecutionPreview (Sprint 3.5). A dry-run: the exact plan a trigger WOULD produce with
 * nothing executed. Shows affected modules, execution order and any modules that would
 * be skipped. Deterministic and transparent — the plan is never hidden from the user.
 */
export function ExecutionPreview({ plan }: { plan: ExecutionPlan }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="heading-s">{PIPELINE_LABEL[plan.pipeline]}</Text>
        <Badge size="sm" variant="info">
          Preview
        </Badge>
        <Badge size="sm" variant="neutral">
          {plan.affected.length} affected
        </Badge>
      </div>
      <Text variant="body-s" tone="subtle">
        {plan.summary}
      </Text>
      <ExecutionGraph steps={plan.order} skipped={plan.skipped} />
      {plan.skipped.length > 0 ? (
        <Text variant="caption" tone="subtle">
          Skipped: {plan.skipped.map((m) => MODULE_LABEL[m]).join(", ")}
        </Text>
      ) : null}
    </Card>
  );
}
