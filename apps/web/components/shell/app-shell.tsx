"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useKeyboardShortcuts } from "@/lib/shell/use-keyboard-shortcuts";
import { useLastPath } from "@/lib/shell/use-last-path";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";
import { ContextPanel } from "./context-panel";
import { MobileNav } from "./mobile-nav";
import { QuickAddDialog } from "./quick-add-dialog";
import { CommandPalette } from "@/components/command-center/command-palette";
import { BuiltinCommands } from "@/lib/command-center/commands/builtin";
import { PlatformBanners } from "@/components/platform/platform-banners";
import { PlatformCommands } from "@/components/platform/platform-commands";
import { TodayCommands } from "@/components/today/today-commands";
import { MorningCommands } from "@/components/morning/morning-commands";
import { DecisionCommands } from "@/components/decision/decision-commands";
import { InboxCommands } from "@/components/inbox/InboxCommands";
import { TaskCommands } from "@/components/task/TaskCommands";
import { PlannerCommands } from "@/components/planner/PlannerCommands";
import { CalendarCommands } from "@/components/calendar/CalendarCommands";
import { ProjectCommands } from "@/components/project/ProjectCommands";
import { HealthCommands } from "@/components/health/HealthCommands";
import { JournalCommands } from "@/components/journal/JournalCommands";
import { FinanceCommands } from "@/components/finance/FinanceCommands";
import { GoalCommands } from "@/components/goal/GoalCommands";
import { TimelineCommands } from "@/components/timeline/TimelineCommands";
import { AnalyticsCommands } from "@/components/analytics/AnalyticsCommands";
import { StudioCommands } from "@/components/tomorrow/StudioCommands";
import { FocusCommands } from "@/components/focus/FocusCommands";
import { NotificationCommands } from "@/components/notification/NotificationCommands";
import { NotificationBanner } from "@/components/notification/NotificationBanner";
import { AutomationCommands } from "@/components/automation/AutomationCommands";
import { OrchestrationCommands } from "@/components/orchestration/OrchestrationCommands";
import { KnowledgeCommands } from "@/components/knowledge/KnowledgeCommands";
import { LifeCommands } from "@/components/life/LifeCommands";
import { ResourceCommands } from "@/components/resource/ResourceCommands";
import { IntelligenceCommands } from "@/components/intelligence/IntelligenceCommands";

/**
 * The OS shell. Every future feature renders inside `children`. Composes the
 * sidebar, top bar, main area, optional context panel and status bar, wires the
 * global keyboard shortcuts, and rehydrates the persisted sidebar state after
 * mount (avoiding an SSR/CSR mismatch). Regions animate in on first load:
 * sidebar → top bar → main.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useKeyboardShortcuts();
  useLastPath();

  // The store rehydrates at client module-load (see store.ts); this flag simply
  // gates the first paint so server and client render the same default layout.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="bg-base text-fg flex h-dvh flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <Sidebar hydrated={hydrated} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <PlatformBanners />
          <div className="flex min-h-0 flex-1">
            <main
              className="animate-slide-up-fade min-w-0 flex-1 overflow-y-auto [animation-fill-mode:both]"
              style={{ animationDelay: "120ms" }}
            >
              {children}
            </main>
            <ContextPanel />
          </div>
        </div>
      </div>
      <StatusBar />

      {/* Command Center: register built-in + platform + today commands + palette */}
      <BuiltinCommands />
      <PlatformCommands />
      <TodayCommands />
      <MorningCommands />
      <DecisionCommands />
      <InboxCommands />
      <TaskCommands />
      <PlannerCommands />
      <CalendarCommands />
      <ProjectCommands />
      <HealthCommands />
      <JournalCommands />
      <FinanceCommands />
      <GoalCommands />
      <TimelineCommands />
      <AnalyticsCommands />
      <StudioCommands />
      <FocusCommands />
      <NotificationCommands />
      <NotificationBanner />
      <AutomationCommands />
      <OrchestrationCommands />
      <KnowledgeCommands />
      <LifeCommands />
      <ResourceCommands />
      <IntelligenceCommands />
      <CommandPalette />

      {/* Overlays */}
      <MobileNav />
      <QuickAddDialog />
    </div>
  );
}
