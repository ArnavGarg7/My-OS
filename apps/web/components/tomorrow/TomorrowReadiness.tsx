"use client";

import { MoonStar } from "lucide-react";
import { Badge, Progress, StatBlock, Text, cn } from "@myos/ui";
import type { TomorrowReadiness as Readiness } from "@myos/core/tomorrow";
import { minutesLabel, readinessTone } from "./tomorrow-icons";

/**
 * TomorrowReadiness (Sprint 3.1). Step 6 — deterministic readiness: sleep target,
 * expected workload, meeting density, focus opportunity + a recovery note.
 */
export function TomorrowReadiness({ readiness }: { readiness: Readiness }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <MoonStar size={18} aria-hidden className={cn(readinessTone(readiness.score))} />
        <Text variant="heading-s" className={cn("tabular-nums", readinessTone(readiness.score))}>
          {readiness.score}
        </Text>
        <Badge size="sm" variant="neutral" className="capitalize">
          {readiness.intensity}
        </Badge>
      </div>
      <Progress value={readiness.score} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Sleep target" value={minutesLabel(readiness.sleepTargetMinutes)} />
        <StatBlock label="Workload" value={minutesLabel(readiness.expectedWorkloadMinutes)} />
        <StatBlock label="Meetings" value={minutesLabel(readiness.meetingMinutes)} />
        <StatBlock label="Focus window" value={minutesLabel(readiness.focusOpportunityMinutes)} />
      </div>
      <Text variant="body-s" tone="subtle">
        {readiness.recoveryRecommendation}
      </Text>
    </div>
  );
}
