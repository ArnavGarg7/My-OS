"use client";

import { INTERRUPTION_TYPES, type InterruptionType } from "@myos/core/focus";
import { Button, Text } from "@myos/ui";
import { INTERRUPTION_ICON, INTERRUPTION_LABEL } from "./focus-icons";

/**
 * InterruptionPanel (Sprint 3.2). Quick one-tap logging of what pulled you away.
 * Each tap records a timestamped interruption and updates the metrics — the point is
 * awareness, not judgement.
 */
export function InterruptionPanel({
  count,
  onLog,
  disabled,
}: {
  count: number;
  onLog: (type: InterruptionType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
          Interruptions
        </Text>
        <Text variant="caption" tone={count > 0 ? "default" : "subtle"}>
          {count}
        </Text>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {INTERRUPTION_TYPES.map((type) => {
          const Icon = INTERRUPTION_ICON[type];
          return (
            <Button
              key={type}
              size="sm"
              variant="secondary"
              onClick={() => onLog(type)}
              disabled={disabled}
            >
              <Icon size={12} aria-hidden /> {INTERRUPTION_LABEL[type]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
