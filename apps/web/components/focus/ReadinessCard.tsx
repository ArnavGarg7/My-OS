"use client";

import { HeartPulse } from "lucide-react";
import { Progress, Text } from "@myos/ui";
import type { FocusReadiness } from "@myos/core/focus";
import { READINESS_LABEL, READINESS_TONE } from "./focus-icons";
import { formatMinutes } from "./format";

/**
 * ReadinessCard (Sprint 3.2). Surfaces the readiness the Health engine (Sprint 2.9)
 * already computed — Focus adds no health logic, it only reflects it here.
 */
export function ReadinessCard({ readiness }: { readiness: FocusReadiness }) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <span className="inline-flex items-center gap-1.5">
        <HeartPulse size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
          Readiness
        </Text>
        <span className={`ml-auto text-sm font-medium ${READINESS_TONE[readiness.level]}`}>
          {READINESS_LABEL[readiness.level]}
        </span>
      </span>
      <Progress
        value={readiness.score}
        tone={
          readiness.level === "low" || readiness.level === "recovery_needed"
            ? "danger"
            : readiness.level === "average"
              ? "warning"
              : "success"
        }
      />
      <Text variant="caption" tone="subtle">
        {readiness.headline}
      </Text>
      <div className="text-fg-subtle flex gap-3 text-xs">
        <span>Sleep {formatMinutes(readiness.sleepMinutes)}</span>
        <span>Hydration {readiness.hydrationPercent}%</span>
      </div>
    </div>
  );
}
