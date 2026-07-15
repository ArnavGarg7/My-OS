"use client";

import { MoonStar } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { STEP_LABEL, statusLabel, type StudioStep, type TomorrowStatus } from "@myos/core/tomorrow";
import { STATUS_VARIANT } from "./tomorrow-icons";
import { StudioProgress } from "./StudioProgress";

/** StudioHeader (Sprint 3.1). Title, plan status + progress for the workflow. */
export function StudioHeader({
  step,
  status,
  targetDate,
}: {
  step: StudioStep;
  status: TomorrowStatus;
  targetDate: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MoonStar size={18} aria-hidden className="text-accent" />
        <Text variant="heading-m">Tomorrow Studio</Text>
        <Badge size="sm" variant={STATUS_VARIANT[status]}>
          {statusLabel(status)}
        </Badge>
        {targetDate ? (
          <Text variant="caption" tone="subtle" className="ml-auto">
            Planning {targetDate}
          </Text>
        ) : null}
      </div>
      <Text variant="heading-s">{STEP_LABEL[step]}</Text>
      <StudioProgress current={step} />
    </div>
  );
}
