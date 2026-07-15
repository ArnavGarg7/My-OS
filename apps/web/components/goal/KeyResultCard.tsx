"use client";

import { useState } from "react";
import { Input, Progress, Text } from "@myos/ui";
import { keyResultProgress, type KeyResult } from "@myos/core/goal";

/**
 * KeyResultCard (Sprint 2.12). A measurable outcome with its derived progress
 * and an inline value update (deterministic metric types only).
 */
export function KeyResultCard({
  keyResult,
  onUpdate,
}: {
  keyResult: KeyResult;
  onUpdate?: ((id: string, currentValue: number) => void) | undefined;
}) {
  const [value, setValue] = useState(String(keyResult.currentValue));
  const progress = keyResultProgress(keyResult);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <Text variant="body-s">{keyResult.title}</Text>
        <Text variant="caption" tone="subtle" className="tabular-nums">
          {keyResult.currentValue}/{keyResult.targetValue} {keyResult.unit} · {progress}%
        </Text>
      </div>
      <Progress value={progress} />
      {onUpdate && keyResult.metricType !== "boolean" && keyResult.metricType !== "milestone" && (
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() =>
            value !== String(keyResult.currentValue) && onUpdate(keyResult.id, Number(value))
          }
          aria-label={`Update ${keyResult.title}`}
          className="h-8"
        />
      )}
    </div>
  );
}
