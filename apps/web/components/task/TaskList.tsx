"use client";

import { ListChecks } from "lucide-react";
import { EmptyState } from "@myos/ui";
import { OPEN_STATUSES, type Task } from "@myos/core/task";
import { TaskRow } from "./TaskRow";

/**
 * The editorial task list (Sprint 2.5). A flat, scannable list of rows — no
 * board, no columns. Overdue + blocked state is derived per row.
 */
export function TaskList({
  tasks,
  selectedId,
  now,
  onSelect,
  onToggle,
  emptyLabel,
}: {
  tasks: Task[];
  selectedId: string | null;
  now: Date;
  onSelect: (id: string) => void;
  onToggle: (task: Task) => void;
  emptyLabel?: string | undefined;
}) {
  if (tasks.length === 0) {
    return (
      <div className="p-10">
        <EmptyState
          icon={ListChecks}
          title="No tasks"
          description={emptyLabel ?? "Create a task or convert something from your inbox."}
        />
      </div>
    );
  }

  const ts = now.getTime();
  return (
    <div role="list" className="flex flex-col">
      {tasks.map((task) => {
        const overdue =
          task.dueAt !== null &&
          new Date(task.dueAt).getTime() < ts &&
          OPEN_STATUSES.includes(task.status);
        return (
          <TaskRow
            key={task.id}
            task={task}
            selected={task.id === selectedId}
            overdue={overdue}
            blocked={task.status === "blocked"}
            onSelect={() => onSelect(task.id)}
            onToggle={() => onToggle(task)}
          />
        );
      })}
    </div>
  );
}
