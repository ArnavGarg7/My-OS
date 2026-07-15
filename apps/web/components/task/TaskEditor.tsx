"use client";

import { useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@myos/ui";
import { TASK_PRIORITIES, type Task, type TaskPriority } from "@myos/core/task";
import { PRIORITY_LABEL } from "./task-icons";

/**
 * Inline task editor (Sprint 2.5). Edits title, description, priority, estimate
 * and due date — committing on blur / change. No modal. Key this by task id so a
 * new selection resets the local draft.
 */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function TaskEditor({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate: (patch: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    estimatedMinutes?: number | null;
    dueAt?: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [estimate, setEstimate] = useState(
    task.estimatedMinutes === null ? "" : String(task.estimatedMinutes),
  );
  const [due, setDue] = useState(toDateInput(task.dueAt));

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== task.title && onUpdate({ title: title.trim() })}
        aria-label="Task title"
        className="text-body-m font-medium"
      />

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== task.description && onUpdate({ description })}
        placeholder="Add a description…"
        rows={3}
        aria-label="Task description"
      />

      <div className="flex items-center justify-between gap-3">
        <Text variant="label" tone="subtle">
          Priority
        </Text>
        <div className="w-32">
          <Select
            value={task.priority}
            onValueChange={(v) => onUpdate({ priority: v as TaskPriority })}
          >
            <SelectTrigger aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Text variant="label" tone="subtle">
          Estimate (min)
        </Text>
        <Input
          type="number"
          min={0}
          value={estimate}
          onChange={(e) => setEstimate(e.target.value)}
          onBlur={() => {
            const next = estimate === "" ? null : Math.max(0, parseInt(estimate, 10) || 0);
            if (next !== task.estimatedMinutes) onUpdate({ estimatedMinutes: next });
          }}
          aria-label="Estimated minutes"
          className="w-28"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Text variant="label" tone="subtle">
          Due date
        </Text>
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          onBlur={() => {
            const next = due ? new Date(`${due}T09:00:00`).toISOString() : null;
            if (next !== task.dueAt) onUpdate({ dueAt: next });
          }}
          aria-label="Due date"
          className="w-40"
        />
      </div>
    </div>
  );
}
