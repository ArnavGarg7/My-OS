"use client";

import { formatDate } from "@myos/shared/format";
import { Text } from "@myos/ui";
import type { Task } from "@myos/core/task";

/**
 * Task timeline (Sprint 2.5). Lifecycle events derived from the task's stored
 * timestamps — created, scheduled, completed. No field-level diffs yet.
 */
export function TaskTimeline({ task }: { task: Task }) {
  const events: { label: string; at: string }[] = [{ label: "Created", at: task.createdAt }];
  if (task.scheduledStart) events.push({ label: "Scheduled", at: task.scheduledStart });
  if (task.completedAt) events.push({ label: "Completed", at: task.completedAt });

  return (
    <ol className="flex flex-col gap-2">
      {events.map((e, i) => (
        <li key={i} className="flex items-start gap-2">
          <span aria-hidden className="bg-accent mt-1.5 size-1.5 shrink-0 rounded-full" />
          <span className="flex flex-1 items-baseline justify-between gap-2">
            <Text variant="body-s">{e.label}</Text>
            <Text variant="caption" tone="subtle">
              {formatDate(e.at)}
            </Text>
          </span>
        </li>
      ))}
    </ol>
  );
}
