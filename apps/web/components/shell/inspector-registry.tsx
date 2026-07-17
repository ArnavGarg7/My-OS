"use client";

import type { ComponentType } from "react";
import { DecisionContextPanel } from "@/components/decision/DecisionContextPanel";
import { InboxContextPanel } from "@/components/inbox/InboxContextPanel";
import { TaskContextPanel } from "@/components/task/TaskContextPanel";
import { PlannerContextPanel } from "@/components/planner/PlannerContextPanel";
import { CalendarContextPanel } from "@/components/calendar/CalendarContextPanel";
import { ProjectContextPanel } from "@/components/project/ProjectContextPanel";
import { JournalContextPanel } from "@/components/journal/JournalContextPanel";
import { FinanceContextPanel } from "@/components/finance/FinanceContextPanel";
import { GoalContextPanel } from "@/components/goal/GoalContextPanel";
import { HealthContextPanel } from "@/components/health/HealthContextPanel";
import { TimelineContextPanel } from "@/components/timeline/TimelineContextPanel";
import { AnalyticsContextPanel } from "@/components/analytics/AnalyticsContextPanel";
import { StudioContextPanel } from "@/components/tomorrow/StudioContextPanel";
import { FocusContextPanel } from "@/components/focus/FocusContextPanel";
import { NotificationContextPanel } from "@/components/notification/NotificationContextPanel";
import { AutomationContextPanel } from "@/components/automation/AutomationContextPanel";
import { OrchestrationContextPanel } from "@/components/orchestration/OrchestrationContextPanel";
import { KnowledgeContextPanel } from "@/components/knowledge/ContextPanel";
import { LifeContextPanel } from "@/components/life/ContextPanel";
import { ResourceContextPanel } from "@/components/resource/ContextPanel";
import { IntelligenceContextPanel } from "@/components/intelligence/ContextPanel";

/**
 * Inspector registry (Sprint 2.8.5). One source of truth mapping a route to its
 * context-panel inspector, so every page plugs into the same architecture. The
 * shell's ContextPanel resolves the active entry by longest-matching prefix —
 * adding a new module's inspector is a one-line registration.
 */
export interface InspectorEntry {
  /** Route prefix this inspector owns (matched by `===` or `startsWith("/prefix/")`). */
  match: string;
  Component: ComponentType;
}

export const INSPECTOR_REGISTRY: InspectorEntry[] = [
  { match: "/today", Component: DecisionContextPanel },
  { match: "/inbox", Component: InboxContextPanel },
  { match: "/tasks", Component: TaskContextPanel },
  { match: "/planner", Component: PlannerContextPanel },
  { match: "/calendar", Component: CalendarContextPanel },
  { match: "/projects", Component: ProjectContextPanel },
  { match: "/health", Component: HealthContextPanel },
  { match: "/journal", Component: JournalContextPanel },
  { match: "/finance", Component: FinanceContextPanel },
  { match: "/goals", Component: GoalContextPanel },
  { match: "/timeline", Component: TimelineContextPanel },
  { match: "/analytics", Component: AnalyticsContextPanel },
  { match: "/tomorrow", Component: StudioContextPanel },
  { match: "/focus", Component: FocusContextPanel },
  { match: "/notifications", Component: NotificationContextPanel },
  { match: "/automation", Component: AutomationContextPanel },
  { match: "/orchestration", Component: OrchestrationContextPanel },
  { match: "/knowledge", Component: KnowledgeContextPanel },
  { match: "/life", Component: LifeContextPanel },
  { match: "/resources", Component: ResourceContextPanel },
  { match: "/dashboard", Component: IntelligenceContextPanel },
];

/** Resolve the inspector that owns a pathname (longest prefix wins), or null. */
export function resolveInspector(pathname: string): ComponentType | null {
  const hit = INSPECTOR_REGISTRY.filter(
    (e) => pathname === e.match || pathname.startsWith(`${e.match}/`),
  ).sort((a, b) => b.match.length - a.match.length)[0];
  return hit?.Component ?? null;
}
