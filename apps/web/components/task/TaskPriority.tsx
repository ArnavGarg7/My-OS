"use client";

import type { TaskPriority as Priority } from "@myos/core/task";
import { PRIORITY_LABEL, PRIORITY_TONE } from "./task-icons";

/** Priority dot + label (Sprint 2.5). */
export function TaskPriority({ priority, hideLabel }: { priority: Priority; hideLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`size-2 rounded-full ${PRIORITY_TONE[priority]}`} />
      {hideLabel ? (
        <span className="sr-only">{PRIORITY_LABEL[priority]}</span>
      ) : (
        <span className="text-body-s text-fg-muted">{PRIORITY_LABEL[priority]}</span>
      )}
    </span>
  );
}
