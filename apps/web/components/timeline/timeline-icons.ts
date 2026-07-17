import {
  Activity,
  Bot,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  Flame,
  Folder,
  HeartPulse,
  Inbox,
  ListChecks,
  NotebookPen,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Wallet,
  LayoutDashboard,
  Workflow,
  Dumbbell,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { MemoryType, TimelineEvent, TimelineSource } from "@myos/core/timeline";

/** Presentational icon + colour + label maps for the Timeline UI (Sprint 2.13). */
export const SOURCE_ICON: Record<TimelineSource, LucideIcon> = {
  today: Sun,
  decision: Zap,
  planner: CalendarDays,
  calendar: CalendarDays,
  task: ListChecks,
  project: Folder,
  goal: Target,
  journal: NotebookPen,
  health: HeartPulse,
  finance: Wallet,
  inbox: Inbox,
  automation: Activity,
  orchestration: Workflow,
  knowledge: Brain,
  life: Dumbbell,
  resource: Wallet,
  dashboard: LayoutDashboard,
  ai: Bot,
};

export const SOURCE_LABEL: Record<TimelineSource, string> = {
  today: "Today",
  decision: "Decision",
  planner: "Planner",
  calendar: "Calendar",
  task: "Task",
  project: "Project",
  goal: "Goal",
  journal: "Journal",
  health: "Health",
  finance: "Finance",
  inbox: "Inbox",
  automation: "Automation",
  orchestration: "Orchestration",
  knowledge: "Knowledge",
  life: "Life",
  resource: "Resources",
  dashboard: "Dashboard",
  ai: "AI",
};

export const SOURCE_COLOR: Record<TimelineSource, string> = {
  today: "var(--warning)",
  decision: "var(--accent)",
  planner: "var(--accent)",
  calendar: "var(--accent)",
  task: "var(--success)",
  project: "var(--accent)",
  goal: "var(--accent)",
  journal: "var(--accent)",
  health: "var(--success)",
  finance: "var(--warning)",
  inbox: "var(--fg-subtle)",
  automation: "var(--fg-subtle)",
  orchestration: "var(--accent)",
  knowledge: "var(--accent)",
  life: "var(--success)",
  resource: "var(--accent)",
  dashboard: "var(--accent)",
  ai: "var(--accent)",
};

/** More specific icons for well-known event types (falls back to source icon). */
const EVENT_ICON: Record<string, LucideIcon> = {
  "goal.completed": Trophy,
  "project.completed": Trophy,
  "objective.completed": Target,
  "milestone.completed": Flag,
  "habit.completed": Flame,
  "task.completed": CheckCircle2,
  "goal.created": Flag,
  "reflection.completed": NotebookPen,
};

export const MEMORY_ICON: Record<MemoryType, LucideIcon> = {
  achievement: Trophy,
  milestone: Flag,
  reflection: NotebookPen,
  health: HeartPulse,
  finance: Wallet,
  learning: Brain,
  personal: Sparkles,
};

export function eventIcon(event: Pick<TimelineEvent, "eventType" | "source">): LucideIcon {
  return EVENT_ICON[event.eventType] ?? SOURCE_ICON[event.source] ?? Clock;
}

/** Compact "3m ago" style relative time. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Clock time e.g. "09:04". */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
