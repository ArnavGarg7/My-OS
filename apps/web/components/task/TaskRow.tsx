"use client";

import { formatRelativeTime } from "@myos/shared/format";
import { cn } from "@myos/ui";
import type { Task } from "@myos/core/task";
import { TaskPriority } from "./TaskPriority";

/**
 * A single task row (Sprint 2.5). Checkbox · title · priority · due. Clicking the
 * checkbox completes; clicking the row selects it (opens in the context panel).
 */
export function TaskRow({
  task,
  selected,
  overdue,
  blocked,
  onSelect,
  onToggle,
}: {
  task: Task;
  selected: boolean;
  overdue?: boolean;
  blocked?: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const done = task.status === "completed";

  return (
    <div
      className={cn(
        "border-border flex items-center gap-3 border-b px-4 py-2.5 transition-colors",
        selected ? "bg-accent-muted/40" : "hover:bg-elevated",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? "Mark incomplete" : "Complete task"}
        onClick={onToggle}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border outline-none transition-colors",
          done ? "border-success bg-success text-inverted" : "border-border hover:border-accent",
        )}
      >
        {done ? <span className="text-[10px] leading-none">✓</span> : null}
      </button>

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
      >
        <TaskPriority priority={task.priority} hideLabel />
        <span
          className={cn(
            "text-body-m truncate",
            done ? "text-fg-subtle line-through" : "text-fg font-medium",
          )}
        >
          {task.title}
        </span>
        {blocked ? <span className="text-caption text-warning shrink-0">blocked</span> : null}
      </button>

      {task.dueAt ? (
        <span
          className={cn(
            "text-caption shrink-0 tabular-nums",
            overdue ? "text-danger" : "text-fg-subtle",
          )}
        >
          {formatRelativeTime(task.dueAt)}
        </span>
      ) : null}
    </div>
  );
}
