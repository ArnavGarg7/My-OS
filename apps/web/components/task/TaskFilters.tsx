"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@myos/ui";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskLabel,
  type TaskPriority,
  type TaskSort,
  type TaskStatus,
} from "@myos/core/task";
import { PRIORITY_LABEL, STATUS_LABEL } from "./task-icons";

/**
 * Task filters (Sprint 2.5). Status · priority · label · sort. These shape the
 * current view; they never mutate tasks.
 */
export function TaskFilters({
  status,
  onStatus,
  priority,
  onPriority,
  labelId,
  onLabel,
  labels,
  sort,
  onSort,
}: {
  status: TaskStatus | null;
  onStatus: (s: TaskStatus | null) => void;
  priority: TaskPriority | null;
  onPriority: (p: TaskPriority | null) => void;
  labelId: string | null;
  onLabel: (id: string | null) => void;
  labels: TaskLabel[];
  sort: TaskSort;
  onSort: (s: TaskSort) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={status ?? "all"}
        onValueChange={(v) => onStatus(v === "all" ? null : (v as TaskStatus))}
      >
        <SelectTrigger className="w-36" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={priority ?? "all"}
        onValueChange={(v) => onPriority(v === "all" ? null : (v as TaskPriority))}
      >
        <SelectTrigger className="w-32" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {labels.length > 0 ? (
        <Select value={labelId ?? "all"} onValueChange={(v) => onLabel(v === "all" ? null : v)}>
          <SelectTrigger className="w-32" aria-label="Filter by label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All labels</SelectItem>
            {labels.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select value={sort} onValueChange={(v) => onSort(v as TaskSort)}>
        <SelectTrigger className="w-32" aria-label="Sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="due">Due date</SelectItem>
          <SelectItem value="created">Created</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
