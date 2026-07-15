import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Flag,
  FolderKanban,
  PauseCircle,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ProjectHealth, ProjectPriority, ProjectStatus } from "@myos/core/project";

/** Presentational icon + tone maps for the Projects UI (Sprint 2.8). */
export const STATUS_ICON: Record<ProjectStatus, LucideIcon> = {
  planning: CircleDashed,
  active: Activity,
  on_hold: PauseCircle,
  completed: CheckCircle2,
  archived: FolderKanban,
};

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

export const HEALTH_LABEL: Record<ProjectHealth, string> = {
  healthy: "Healthy",
  at_risk: "At risk",
  behind: "Behind",
  blocked: "Blocked",
  completed: "Completed",
};

/** Tailwind text/background tone per health (design-system tokens). */
export const HEALTH_TONE: Record<ProjectHealth, string> = {
  healthy: "text-success",
  at_risk: "text-warning",
  behind: "text-warning",
  blocked: "text-danger",
  completed: "text-fg-subtle",
};

export const HEALTH_DOT: Record<ProjectHealth, string> = {
  healthy: "bg-success",
  at_risk: "bg-warning",
  behind: "bg-warning",
  blocked: "bg-danger",
  completed: "bg-fg-subtle",
};

export const PRIORITY_LABEL: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const META_ICONS = {
  milestone: Flag,
  objective: Target,
  forecast: TrendingUp,
  deadline: Clock,
  risk: AlertTriangle,
};
