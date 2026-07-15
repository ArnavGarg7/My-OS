"use client";

import { Progress, Text } from "@myos/ui";
import { objectiveProgress, type Objective } from "@myos/core/goal";
import { KeyResultCard } from "./KeyResultCard";

/**
 * ObjectiveCard (Sprint 2.12). An objective + its key results, with derived
 * progress (mean of key results).
 */
export function ObjectiveCard({
  objective,
  onUpdateKeyResult,
}: {
  objective: Objective;
  onUpdateKeyResult?: (id: string, currentValue: number) => void;
}) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <Text variant="body-s" className="font-medium">
          {objective.title}
        </Text>
        <Text variant="caption" tone="subtle" className="tabular-nums">
          {objectiveProgress(objective)}%
        </Text>
      </div>
      <Progress value={objectiveProgress(objective)} />
      {objective.keyResults.length > 0 && (
        <div className="mt-1 flex flex-col gap-2">
          {objective.keyResults.map((kr) => (
            <KeyResultCard key={kr.id} keyResult={kr} onUpdate={onUpdateKeyResult} />
          ))}
        </div>
      )}
    </div>
  );
}
