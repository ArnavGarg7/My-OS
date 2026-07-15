"use client";

import { Progress, Text } from "@myos/ui";
import type { HealthSummary } from "@myos/core/health";
import { RECOVERY_LABEL } from "./health-icons";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-label text-fg-subtle">{label}</span>
      <span className="text-body-s text-fg-muted tabular-nums">{value}</span>
    </div>
  );
}

/**
 * HealthInspector (Sprint 2.9). The compact readiness + signals breakdown reused
 * by the context panel: readiness inputs, hydration, nutrition, recovery.
 */
export function HealthInspector({ summary }: { summary: HealthSummary }) {
  const r = summary.readiness;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Text variant="heading-s">Readiness</Text>
          <Text variant="heading-s" className="tabular-nums">
            {r.score}
          </Text>
        </div>
        <Progress value={r.score} />
        <Text variant="caption" tone="subtle">
          {r.recommendation}
        </Text>
      </div>

      <div className="flex flex-col gap-1.5">
        <Text variant="label" tone="subtle">
          Inputs
        </Text>
        <Row label="Sleep" value={String(r.inputs.sleep)} />
        <Row label="Recovery" value={String(r.inputs.recovery)} />
        <Row label="Hydration" value={String(r.inputs.hydration)} />
        <Row label="Energy" value={String(r.inputs.energy)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Text variant="label" tone="subtle">
          Today
        </Text>
        <Row label="Water" value={`${summary.hydration.totalMl}/${summary.hydration.goalMl}ml`} />
        <Row label="Calories" value={`${summary.nutrition.calories} kcal`} />
        <Row label="Protein" value={`${summary.nutrition.protein}g`} />
        <Row label="Recovery" value={RECOVERY_LABEL[summary.recovery.status]} />
      </div>
    </div>
  );
}
