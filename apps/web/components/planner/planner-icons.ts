import {
  Brain,
  Users,
  ListChecks,
  Coffee,
  Wind,
  ArrowDownWideNarrow,
  type LucideIcon,
} from "lucide-react";
import type { PlannerBlockType } from "@myos/core/planner";

/** Block type → icon + tone (Sprint 2.6). Presentational only. */
export const BLOCK_ICON: Record<PlannerBlockType, LucideIcon> = {
  focus: Brain,
  meeting: Users,
  task: ListChecks,
  break: Coffee,
  buffer: Wind,
  overflow: ArrowDownWideNarrow,
};

export const BLOCK_TONE: Record<PlannerBlockType, string> = {
  focus: "border-accent bg-accent-muted/30",
  meeting: "border-info bg-info-subtle/40",
  task: "border-border bg-surface",
  break: "border-success bg-success-subtle/40",
  buffer: "border-border bg-elevated",
  overflow: "border-danger bg-danger-subtle/30",
};

export const BLOCK_DOT: Record<PlannerBlockType, string> = {
  focus: "bg-accent",
  meeting: "bg-info",
  task: "bg-fg-muted",
  break: "bg-success",
  buffer: "bg-fg-subtle",
  overflow: "bg-danger",
};

export const BLOCK_LABEL: Record<PlannerBlockType, string> = {
  focus: "Focus",
  meeting: "Meeting",
  task: "Task",
  break: "Break",
  buffer: "Buffer",
  overflow: "Overflow",
};
