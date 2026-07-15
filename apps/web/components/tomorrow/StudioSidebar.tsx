"use client";

import { Text } from "@myos/ui";
import type { StudioStep, TomorrowStudioState } from "@myos/core/tomorrow";
import { StudioStepper } from "./StudioStepper";

/**
 * StudioSidebar (Sprint 3.1). The left rail — the step rail plus a live snapshot
 * of the emerging plan.
 */
export function StudioSidebar({
  step,
  onStep,
  state,
}: {
  step: StudioStep;
  onStep: (s: StudioStep) => void;
  state: TomorrowStudioState | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StudioStepper current={step} onStep={onStep} />
      {state ? (
        <div className="border-border flex flex-col gap-1 border-t pt-3">
          <Text variant="label" tone="subtle">
            Emerging plan
          </Text>
          <Text variant="caption" tone="subtle">
            {state.priorities.top.length} priorities · {state.carryForward.total} carrying
          </Text>
          <Text variant="caption" tone="subtle">
            Readiness {state.readiness.score} · checklist {state.checklist.percent}%
          </Text>
        </div>
      ) : null}
    </div>
  );
}
