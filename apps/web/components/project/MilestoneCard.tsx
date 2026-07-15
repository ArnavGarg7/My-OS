"use client";

import { Check, Flag } from "lucide-react";
import { Button, cn, Text } from "@myos/ui";
import type { Milestone } from "@myos/core/project";

/**
 * MilestoneCard (Sprint 2.8). A milestone row with its due date and a complete
 * action. The Planner consumes the deadline; here we only present + complete.
 */
export function MilestoneCard({
  milestone,
  progress,
  overdue,
  onComplete,
}: {
  milestone: Milestone;
  progress?: number | undefined;
  overdue?: boolean | undefined;
  onComplete?: ((id: string) => void) | undefined;
}) {
  const due = milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : "No date";
  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-3">
      <Flag
        size={16}
        aria-hidden
        className={cn(milestone.completed ? "text-success" : "text-fg-subtle")}
      />
      <div className="min-w-0 flex-1">
        <Text variant="body-s" className={cn("truncate", milestone.completed && "line-through")}>
          {milestone.title}
        </Text>
        <Text variant="caption" tone={overdue ? "danger" : "subtle"}>
          {overdue ? "Overdue · " : ""}
          {due}
          {progress !== undefined ? ` · ${progress}%` : ""}
        </Text>
      </div>
      {!milestone.completed && onComplete && (
        <Button size="sm" variant="ghost" onClick={() => onComplete(milestone.id)}>
          <Check size={14} aria-hidden />
          Complete
        </Button>
      )}
    </div>
  );
}
