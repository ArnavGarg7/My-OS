"use client";

import { Bed } from "lucide-react";
import { Progress, Text } from "@myos/ui";
import type { SleepAnalysis } from "@myos/core/health";
import { formatMinutes } from "./health-icons";

/** Sleep card (Sprint 2.9): duration, score, debt, consistency. */
export function SleepCard({ sleep }: { sleep: SleepAnalysis | null }) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Bed size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Sleep</Text>
      </div>
      {sleep ? (
        <>
          <Text variant="heading-xl" className="tabular-nums">
            {formatMinutes(sleep.durationMinutes)}
          </Text>
          <Progress value={sleep.score} />
          <Text variant="caption" tone="subtle">
            Score {sleep.score} · consistency {sleep.consistency}%
            {sleep.debtMinutes > 0 ? ` · debt ${formatMinutes(sleep.debtMinutes)}` : ""}
          </Text>
        </>
      ) : (
        <Text variant="body-s" tone="subtle">
          No sleep logged yet.
        </Text>
      )}
    </div>
  );
}
