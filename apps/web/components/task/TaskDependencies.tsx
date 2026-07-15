"use client";

import { X, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  IconButton,
} from "@myos/ui";
import type { Task } from "@myos/core/task";

/**
 * Task dependencies (Sprint 2.5). Lists what this task depends on (with remove)
 * and offers a picker to add another. Cycle/self/duplicate protection lives in
 * the engine — the server rejects invalid edges.
 */
export function TaskDependencies({
  task,
  allTasks,
  onAdd,
  onRemove,
}: {
  task: Task;
  allTasks: Task[];
  onAdd: (dependsOnTaskId: string) => void;
  onRemove: (dependsOnTaskId: string) => void;
}) {
  const byId = new Map(allTasks.map((t) => [t.id, t]));
  const candidates = allTasks.filter(
    (t) => t.id !== task.id && !task.dependencies.includes(t.id) && t.status !== "archived",
  );

  return (
    <div className="flex flex-col gap-2">
      {task.dependencies.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          No dependencies.
        </Text>
      ) : (
        <ul className="flex flex-col gap-1">
          {task.dependencies.map((id) => {
            const dep = byId.get(id);
            const done = dep?.status === "completed";
            return (
              <li
                key={id}
                className="border-border flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${done ? "bg-success" : "bg-warning"}`}
                  />
                  <span className="text-body-s text-fg-muted truncate">
                    {dep?.title ?? "Unknown task"}
                  </span>
                </span>
                <IconButton
                  aria-label="Remove dependency"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onRemove(id)}
                >
                  <X size={13} aria-hidden />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}

      {candidates.length > 0 ? (
        <Select value="" onValueChange={(v) => v && onAdd(v)}>
          <SelectTrigger aria-label="Add dependency" className="w-full">
            <span className="text-fg-subtle flex items-center gap-1.5">
              <Plus size={14} aria-hidden />
              <SelectValue placeholder="Add a dependency…" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {candidates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
