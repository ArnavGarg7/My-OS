import {
  Bell,
  Brain,
  Coffee,
  Footprints,
  MessageSquare,
  MonitorPause,
  Phone,
  Sparkles,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type {
  BreakType,
  InterruptionType,
  ReadinessLevel,
  SessionStatus,
  SessionType,
} from "@myos/core/focus";

/**
 * Focus icon + tone maps (Sprint 3.2). Pure presentation lookup tables shared by the
 * workspace components so status/type styling stays consistent.
 */
export const SESSION_TYPE_ICON: Record<SessionType, LucideIcon> = {
  focus: Brain,
  deep_work: Brain,
  shallow_work: Target,
  review: Sparkles,
  break: Coffee,
  recovery: Footprints,
  planning: Target,
  meeting: MonitorPause,
};

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  focus: "Focus",
  deep_work: "Deep Work",
  shallow_work: "Shallow Work",
  review: "Review",
  break: "Break",
  recovery: "Recovery",
  planning: "Planning",
  meeting: "Meeting",
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
  break: "On Break",
  completed: "Completed",
  cancelled: "Cancelled",
  abandoned: "Abandoned",
};

export const STATUS_DOT: Record<SessionStatus, string> = {
  idle: "bg-fg-subtle",
  running: "bg-success",
  paused: "bg-warning",
  break: "bg-accent",
  completed: "bg-success",
  cancelled: "bg-fg-subtle",
  abandoned: "bg-danger",
};

export const INTERRUPTION_ICON: Record<InterruptionType, LucideIcon> = {
  phone: Phone,
  meeting: MonitorPause,
  message: MessageSquare,
  distraction: Bell,
  other: Bell,
};

export const INTERRUPTION_LABEL: Record<InterruptionType, string> = {
  phone: "Phone",
  meeting: "Meeting",
  message: "Message",
  distraction: "Distraction",
  other: "Other",
};

export const BREAK_ICON: Record<BreakType, LucideIcon> = {
  short: Coffee,
  long: Coffee,
  recovery: Footprints,
  hydration: Coffee,
  walk: Footprints,
};

export const READINESS_TONE: Record<ReadinessLevel, string> = {
  ready: "text-success",
  good: "text-success",
  average: "text-warning",
  low: "text-danger",
  recovery_needed: "text-danger",
};

export const READINESS_LABEL: Record<ReadinessLevel, string> = {
  ready: "Ready",
  good: "Good",
  average: "Average",
  low: "Low",
  recovery_needed: "Recovery Needed",
};

export const FocusIcon = Timer;
