"use client";

import { BatteryCharging } from "lucide-react";
import { Badge, Progress, Text } from "@myos/ui";
import type { RecoveryResult } from "@myos/core/health";
import { RECOVERY_LABEL, RECOVERY_TONE } from "./health-icons";

/** Recovery card (Sprint 2.9): status + score + reasons. */
export function RecoveryCard({ recovery }: { recovery: RecoveryResult }) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <BatteryCharging size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Recovery</Text>
        <Badge size="sm" variant={RECOVERY_TONE[recovery.status]}>
          {RECOVERY_LABEL[recovery.status]}
        </Badge>
      </div>
      <Progress value={recovery.score} />
      <ul className="flex flex-col gap-0.5 pt-1">
        {recovery.reasons.slice(0, 3).map((r) => (
          <li key={r} className="text-caption text-fg-subtle">
            • {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
