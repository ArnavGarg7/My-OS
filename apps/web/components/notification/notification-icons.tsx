import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  FolderKanban,
  HeartPulse,
  Info,
  Settings2,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NotificationPriority, NotificationType } from "@myos/core/notification";

/**
 * Notification icon + tone maps (Sprint 3.3). Pure presentation lookups shared by the
 * center, cards, banner and status indicator.
 */
export const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  reminder: Clock,
  alert: TriangleAlert,
  information: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  system: Settings2,
  health: HeartPulse,
  calendar: CalendarClock,
  planner: Sparkles,
  finance: Wallet,
  goals: Target,
  projects: FolderKanban,
  focus: Timer,
};

export const PRIORITY_TONE: Record<NotificationPriority, string> = {
  critical: "text-danger",
  high: "text-warning",
  medium: "text-accent",
  low: "text-fg-muted",
  silent: "text-fg-subtle",
};

export const PRIORITY_DOT: Record<NotificationPriority, string> = {
  critical: "bg-danger",
  high: "bg-warning",
  medium: "bg-accent",
  low: "bg-fg-subtle",
  silent: "bg-fg-subtle",
};

export const PRIORITY_BADGE: Record<
  NotificationPriority,
  "danger" | "warning" | "accent" | "neutral"
> = {
  critical: "danger",
  high: "warning",
  medium: "accent",
  low: "neutral",
  silent: "neutral",
};

export const PRIORITY_LABEL: Record<NotificationPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  silent: "Silent",
};

export const TYPE_LABEL: Record<NotificationType, string> = {
  reminder: "Reminder",
  alert: "Alert",
  information: "Information",
  warning: "Warning",
  success: "Success",
  system: "System",
  health: "Health",
  calendar: "Calendar",
  planner: "Planner",
  finance: "Finance",
  goals: "Goals",
  projects: "Projects",
  focus: "Focus",
};

export const NotificationBellIcon = Bell;
