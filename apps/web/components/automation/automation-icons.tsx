import {
  Bell,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock,
  FolderKanban,
  HeartPulse,
  Inbox,
  ListChecks,
  type LucideIcon,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  Wallet,
  Zap,
} from "lucide-react";
import type {
  ActionKind,
  AutomationPriority,
  AutomationStatus,
  ExecutionOutcome,
  TriggerKind,
} from "@myos/core/automation";

/**
 * Automation icon + tone maps (Sprint 3.4). Pure presentation lookups shared by the
 * editor, list, history and status indicator.
 */
export const TRIGGER_ICON: Record<TriggerKind, LucideIcon> = {
  planner: Sparkles,
  task: ListChecks,
  focus: Timer,
  calendar: CalendarClock,
  notification: Bell,
  health: HeartPulse,
  journal: Brain,
  finance: Wallet,
  goals: Target,
  projects: FolderKanban,
  timeline: Clock,
  analytics: Zap,
  tomorrow: Sparkles,
  morning: Sparkles,
  inbox: Inbox,
  manual: Zap,
  time: Clock,
};

export const STATUS_BADGE: Record<AutomationStatus, "success" | "neutral" | "warning" | "danger"> =
  {
    created: "neutral",
    enabled: "success",
    disabled: "neutral",
    archived: "warning",
  };

export const STATUS_LABEL: Record<AutomationStatus, string> = {
  created: "Created",
  enabled: "Enabled",
  disabled: "Disabled",
  archived: "Archived",
};

export const PRIORITY_BADGE: Record<
  AutomationPriority,
  "danger" | "warning" | "accent" | "neutral"
> = {
  critical: "danger",
  high: "warning",
  medium: "accent",
  low: "neutral",
};

export const OUTCOME_TONE: Record<ExecutionOutcome, "success" | "warning" | "danger" | "neutral"> =
  {
    triggered: "neutral",
    conditions_failed: "neutral",
    executing: "accent" as never,
    completed: "success",
    failed: "danger",
    skipped: "neutral",
    cancelled: "neutral",
    expired: "danger",
    pending_approval: "warning",
  };

export const OUTCOME_ICON: Partial<Record<ExecutionOutcome, LucideIcon>> = {
  completed: CheckCircle2,
  failed: TriangleAlert,
};

export const AutomationIcon = Zap;

export function actionLabel(kind: ActionKind): string {
  return kind
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
