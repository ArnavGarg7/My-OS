import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  FolderKanban,
  HeartPulse,
  Inbox,
  LifeBuoy,
  ListChecks,
  type LucideIcon,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  Target,
  Timer,
  TriangleAlert,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import type {
  OrchestrationModule,
  OrchestrationStatus,
  PipelineKind,
  RecoveryStrategy,
} from "@myos/core/orchestration";
import type { ExecutionStep } from "@myos/core/orchestration";

/**
 * Orchestration icon + tone maps (Sprint 3.5). Pure presentation lookups shared by the
 * execution graph, pipeline view, run history, recovery and status indicator.
 */
export const OrchestrationIcon = Workflow;

export const MODULE_ICON: Record<OrchestrationModule, LucideIcon> = {
  calendar: CalendarClock,
  planner: Sparkles,
  focus: Timer,
  task: ListChecks,
  decision: Zap,
  health: HeartPulse,
  finance: Wallet,
  goal: Target,
  project: FolderKanban,
  inbox: Inbox,
  notification: Bell,
  morning: Sunrise,
  tomorrow: Sun,
  timeline: Clock,
  analytics: BarChart3,
};

export const MODULE_LABEL: Record<OrchestrationModule, string> = {
  calendar: "Calendar",
  planner: "Planner",
  focus: "Focus",
  task: "Tasks",
  decision: "Decision",
  health: "Health",
  finance: "Finance",
  goal: "Goals",
  project: "Projects",
  inbox: "Inbox",
  notification: "Notifications",
  morning: "Morning",
  tomorrow: "Tomorrow",
  timeline: "Timeline",
  analytics: "Analytics",
};

export const PIPELINE_LABEL: Record<PipelineKind, string> = {
  calendar: "Calendar changed",
  planner: "Planner regenerated",
  focus: "Focus session ended",
  health: "Health signal changed",
  finance: "Finance event",
  goal: "Goal updated",
  project: "Project changed",
  inbox: "Inbox event",
  tomorrow: "Tomorrow finalized",
  morning: "Morning completed",
};

export const STATUS_BADGE: Record<
  OrchestrationStatus,
  "success" | "neutral" | "warning" | "danger" | "accent"
> = {
  pending: "neutral",
  running: "accent",
  completed: "success",
  recovering: "warning",
  recovered: "warning",
  failed: "danger",
  skipped: "neutral",
};

export const STATUS_LABEL: Record<OrchestrationStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  recovering: "Recovering",
  recovered: "Recovered",
  failed: "Failed",
  skipped: "Skipped",
};

export const MODE_LABEL: Record<ExecutionStep["mode"], string> = {
  regenerate: "Regenerate",
  refresh: "Refresh",
  recommend: "Recommend",
  record: "Record",
};

export const STRATEGY_LABEL: Record<RecoveryStrategy, string> = {
  retry_step: "Retry step",
  skip_downstream: "Skip downstream",
  use_previous: "Use previous",
  skip_step: "Skip step",
  notify_user: "Notify user",
  abort: "Abort run",
};

export const STRATEGY_ICON: Record<RecoveryStrategy, LucideIcon> = {
  retry_step: RefreshCw,
  skip_downstream: Activity,
  use_previous: LifeBuoy,
  skip_step: Activity,
  notify_user: Bell,
  abort: TriangleAlert,
};

export const OUTCOME_ICON: Record<string, LucideIcon> = {
  completed: CheckCircle2,
  recovered: LifeBuoy,
  failed: TriangleAlert,
  skipped: Activity,
};
