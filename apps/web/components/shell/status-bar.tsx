"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@myos/ui";
import { useConnection, useNotifications, usePlatform, useUpdates } from "@/lib/platform";
import { useBackgroundSync } from "@/lib/platform";
import { TodayFocusStatus } from "@/components/today/today-focus-status";
import { MorningFlashStatus } from "@/components/morning/MorningFlashStatus";
import { DecisionStatusIndicator } from "@/components/decision/DecisionStatusIndicator";
import { InboxStatusIndicator } from "@/components/inbox/InboxStatusIndicator";
import { TaskStatusIndicator } from "@/components/task/TaskStatusIndicator";
import { PlannerStatusIndicator } from "@/components/planner/PlannerStatusIndicator";
import { CalendarStatusIndicator } from "@/components/calendar/CalendarStatusIndicator";
import { ProjectStatusBar } from "@/components/project/ProjectStatusBar";
import { HealthStatusIndicator } from "@/components/health/HealthStatusIndicator";
import { JournalStatusIndicator } from "@/components/journal/JournalStatusIndicator";
import { FinanceStatusIndicator } from "@/components/finance/FinanceStatusIndicator";
import { GoalStatusIndicator } from "@/components/goal/GoalStatusIndicator";
import { TimelineStatusIndicator } from "@/components/timeline/TimelineStatusIndicator";
import { AnalyticsStatusIndicator } from "@/components/analytics/AnalyticsStatusIndicator";
import { StudioStatusIndicator } from "@/components/tomorrow/StudioStatusIndicator";
import { FocusStatusIndicator } from "@/components/focus/FocusStatusIndicator";
import { NotificationStatusIndicator } from "@/components/notification/NotificationStatusIndicator";
import { AutomationStatusIndicator } from "@/components/automation/AutomationStatusIndicator";
import { OrchestrationStatusIndicator } from "@/components/orchestration/OrchestrationStatusIndicator";

type Tone = "success" | "warning" | "danger" | "muted";

const DOT_TONE: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-fg-subtle",
};

function StatusItem({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  tone?: Tone;
  onClick?: () => void;
}) {
  const content = (
    <>
      {tone ? <span aria-hidden className={`size-1.5 rounded-full ${DOT_TONE[tone]}`} /> : null}
      <span className="text-fg-subtle">{label}</span>
      <span className="text-fg-muted font-medium">{value}</span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hover:text-fg focus-visible:ring-ring flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-1"
      >
        {content}
      </button>
    );
  }
  return <div className="flex items-center gap-1.5">{content}</div>;
}

/**
 * Slim bottom status bar (Sprint 1.3, expanded in 1.7). Platform state is driven
 * entirely by providers (connection / notifications / updates / platform); the
 * Database / Worker / AI items remain infrastructure placeholders.
 */
export function StatusBar() {
  const { resolvedTheme } = useTheme();
  const connection = useConnection();
  const notifications = useNotifications();
  const updates = useUpdates();
  const platform = usePlatform();
  const backgroundSync = useBackgroundSync();
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <footer className="border-border bg-surface text-caption flex h-7 shrink-0 items-center justify-between gap-4 border-t px-3 font-mono tabular-nums sm:px-4">
      <div className="flex items-center gap-3 overflow-hidden sm:gap-4">
        <StatusItem
          label="Network"
          value={connection.online ? "Online" : "Offline"}
          tone={connection.online ? "success" : "danger"}
        />
        <StatusItem label="Database" value="Connected" tone="success" />
        <div className="hidden sm:block">
          <StatusItem label="Worker" value="Running" tone="success" />
        </div>
        <div className="hidden lg:block">
          <StatusItem label="AI" value="Disabled" tone="muted" />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <MorningFlashStatus />
        <div className="hidden 2xl:block">
          <ProjectStatusBar />
        </div>
        <div className="hidden 2xl:block">
          <CalendarStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <PlannerStatusIndicator />
        </div>
        <div className="hidden xl:block">
          <TaskStatusIndicator />
        </div>
        <div className="hidden lg:block">
          <InboxStatusIndicator />
        </div>
        <div className="hidden md:block">
          <DecisionStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <HealthStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <JournalStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <FinanceStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <GoalStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <TimelineStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <AnalyticsStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <StudioStatusIndicator />
        </div>
        <div className="hidden xl:block">
          <FocusStatusIndicator />
        </div>
        <div className="hidden lg:block">
          <NotificationStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <AutomationStatusIndicator />
        </div>
        <div className="hidden 2xl:block">
          <OrchestrationStatusIndicator />
        </div>
        <div className="hidden max-w-[200px] 2xl:block">
          <TodayFocusStatus />
        </div>
        {updates.updateAvailable ? (
          <StatusItem
            label="Update"
            value="Ready"
            tone="warning"
            onClick={() => updates.applyUpdate()}
          />
        ) : null}
        <div className="hidden md:block">
          <StatusItem
            label="Notifications"
            value={notifications.isGranted ? "On" : "Off"}
            tone={notifications.isGranted ? "success" : "muted"}
          />
        </div>
        {backgroundSync.supported ? (
          <div className="hidden xl:block">
            <StatusItem label="Sync" value="Ready" tone="success" />
          </div>
        ) : null}
        {platform.standalone ? (
          <div className="hidden lg:block">
            <StatusItem label="App" value="Installed" tone="success" />
          </div>
        ) : null}
        <div className="hidden sm:block">
          <StatusItem label="Theme" value={resolvedTheme === "dark" ? "Dark" : "Light"} />
        </div>
        <div className="hidden md:block">
          <StatusItem label="Version" value={`v${platform.appVersion}`} />
        </div>
        <span className="text-fg-muted" suppressHydrationWarning>
          {now ?? "--:--:--"}
        </span>
      </div>
    </footer>
  );
}
