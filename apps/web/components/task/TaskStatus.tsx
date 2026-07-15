"use client";

import { Badge } from "@myos/ui";
import type { TaskStatus as Status } from "@myos/core/task";
import { STATUS_LABEL } from "./task-icons";

const VARIANT: Record<Status, "neutral" | "info" | "warning" | "success" | "outline"> = {
  not_started: "neutral",
  in_progress: "info",
  blocked: "warning",
  completed: "success",
  archived: "outline",
};

/** Small status pill for a task (Sprint 2.5). */
export function TaskStatus({ status }: { status: Status }) {
  return (
    <Badge size="sm" variant={VARIANT[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
