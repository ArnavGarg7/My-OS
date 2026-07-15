import { Circle, CircleDot, Ban, CheckCircle2, Archive, type LucideIcon } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@myos/core/task";

/** Status → icon (Sprint 2.5). Presentational only. */
export const STATUS_ICON: Record<TaskStatus, LucideIcon> = {
  not_started: Circle,
  in_progress: CircleDot,
  blocked: Ban,
  completed: CheckCircle2,
  archived: Archive,
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
  archived: "Archived",
};

/** Priority → semantic tone + dot color. */
export const PRIORITY_TONE: Record<TaskPriority, string> = {
  urgent: "bg-danger",
  high: "bg-warning",
  medium: "bg-info",
  low: "bg-fg-subtle",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const LABEL_DOT: Record<string, string> = {
  gray: "bg-fg-subtle",
  red: "bg-danger",
  amber: "bg-warning",
  green: "bg-success",
  blue: "bg-info",
  violet: "bg-accent",
};
