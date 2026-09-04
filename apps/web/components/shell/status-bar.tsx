"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useNotifications, usePlatform, useUpdates } from "@/lib/platform";
import { useBackgroundSync } from "@/lib/platform";
import { trpc } from "@/lib/trpc/client";
import { MorningFlashStatus } from "@/components/morning/MorningFlashStatus";
import { DecisionStatusIndicator } from "@/components/decision/DecisionStatusIndicator";
import { InboxStatusIndicator } from "@/components/inbox/InboxStatusIndicator";
import { TaskStatusIndicator } from "@/components/task/TaskStatusIndicator";
import { FocusStatusIndicator } from "@/components/focus/FocusStatusIndicator";

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
  href,
  title,
}: {
  label: string;
  value: string;
  tone?: Tone;
  onClick?: () => void;
  href?: string;
  title?: string;
}) {
  const content = (
    <>
      {tone ? <span aria-hidden className={`size-1.5 rounded-full ${DOT_TONE[tone]}`} /> : null}
      <span className="text-fg-subtle">{label}</span>
      <span className="text-fg-muted font-medium">{value}</span>
    </>
  );
  const interactiveClass =
    "hover:text-fg focus-visible:ring-ring flex items-center gap-1.5 rounded-sm outline-none transition-colors focus-visible:ring-1";
  if (href) {
    return (
      <Link href={href} title={title} className={interactiveClass}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={interactiveClass}>
        {content}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5" title={title}>
      {content}
    </div>
  );
}

/**
 * Slim bottom status bar (Sprint 1.3; simplified in UX pass 1). Infrastructure health (network,
 * database, worker, sync, version) is collapsed into a single "System" indicator with the details in
 * its hover tooltip, so the bar reads as a calm health line rather than a debug console. Only a few
 * genuinely useful at-a-glance items (tasks, inbox, today's decision, focus, notifications) remain;
 * per-module state lives on each module's own page.
 */
export function StatusBar() {
  const connection = useConnection();
  const notifications = useNotifications();
  const updates = useUpdates();
  const platform = usePlatform();
  const backgroundSync = useBackgroundSync();
  const activeNotifications = trpc.notification.active.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const unread = activeNotifications.data?.length ?? 0;
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const systemDetail =
    `Network ${connection.online ? "online" : "offline"} · Database connected · Worker running` +
    `${backgroundSync.supported ? " · Sync ready" : ""} · v${platform.appVersion}`;

  return (
    <footer className="border-border bg-surface text-caption flex h-7 shrink-0 items-center justify-between gap-4 border-t px-3 tabular-nums sm:px-4">
      <div className="flex items-center gap-3 overflow-hidden sm:gap-4">
        <StatusItem
          label="System"
          value={connection.online ? "Online" : "Offline"}
          tone={connection.online ? "success" : "danger"}
          title={systemDetail}
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <MorningFlashStatus />
        <div className="hidden md:block">
          <TaskStatusIndicator />
        </div>
        <div className="hidden lg:block">
          <InboxStatusIndicator />
        </div>
        <div className="hidden md:block">
          <DecisionStatusIndicator />
        </div>
        <div className="hidden lg:block">
          <FocusStatusIndicator />
        </div>
        {updates.updateAvailable ? (
          <StatusItem
            label="Update"
            value="Ready"
            tone="warning"
            onClick={() => updates.applyUpdate()}
          />
        ) : null}
        <div className="hidden sm:block">
          <StatusItem
            label="Notifications"
            href="/notifications"
            value={unread > 0 ? `${unread} unread` : notifications.isGranted ? "On" : "Off"}
            tone={unread > 0 ? "warning" : notifications.isGranted ? "success" : "muted"}
            title={
              notifications.isGranted ? "Alerts enabled" : "Alerts disabled — enable in Settings"
            }
          />
        </div>
        <span className="text-fg-muted" suppressHydrationWarning>
          {now ?? "--:--"}
        </span>
      </div>
    </footer>
  );
}
