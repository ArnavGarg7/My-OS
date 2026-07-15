"use client";

import { Badge, Checkbox, Progress, Text, cn } from "@myos/ui";
import type { ChecklistProgress } from "@myos/core/tomorrow";

/**
 * TomorrowChecklist (Sprint 3.1). Step 7 — the static, user-configurable evening
 * checklist. Required items gate finalisation.
 */
export function TomorrowChecklist({
  checklist,
  onToggle,
}: {
  checklist: ChecklistProgress;
  onToggle: (id: string, completed: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Text variant="body-s" tone="subtle">
          {checklist.completed}/{checklist.total} done
        </Text>
        {checklist.allRequiredDone ? (
          <Badge size="sm" variant="success">
            Ready
          </Badge>
        ) : (
          <Badge size="sm" variant="warning">
            {checklist.requiredRemaining} required left
          </Badge>
        )}
      </div>
      <Progress value={checklist.percent} />
      <ul className="flex flex-col gap-1">
        {checklist.items.map((i) => (
          <li key={i.id}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md p-1.5">
              <Checkbox checked={i.completed} onCheckedChange={(c) => onToggle(i.id, Boolean(c))} />
              <Text variant="body-s" className={cn(i.completed && "text-fg-subtle line-through")}>
                {i.item}
              </Text>
              {i.required ? (
                <Text variant="caption" tone="subtle">
                  required
                </Text>
              ) : null}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
