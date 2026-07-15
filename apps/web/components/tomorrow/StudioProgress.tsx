"use client";

import { Progress, Text } from "@myos/ui";
import { STUDIO_STEPS, studioProgress, type StudioStep } from "@myos/core/tomorrow";

/** StudioProgress (Sprint 3.1). A compact progress bar for the guided flow. */
export function StudioProgress({ current }: { current: StudioStep }) {
  const index = STUDIO_STEPS.indexOf(current);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Text variant="caption" tone="subtle">
          Step {index + 1} of {STUDIO_STEPS.length}
        </Text>
        <Text variant="caption" tone="subtle">
          {studioProgress(current)}%
        </Text>
      </div>
      <Progress value={studioProgress(current)} />
    </div>
  );
}
