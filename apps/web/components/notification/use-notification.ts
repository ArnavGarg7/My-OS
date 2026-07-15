"use client";

import { useMemo, useState } from "react";
import type { NotificationType, ReminderWindow } from "@myos/core/notification";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Notification center controller (Sprint 3.3). Owns the list queries, the active
 * filter, and every lifecycle mutation. Emits timeline + analytics events. The engine
 * is deterministic — this hook only drives it and reflects state.
 */
export type NotificationFilter = "active" | "unread" | "queued" | "all";

export function useNotification() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const [filter, setFilter] = useState<NotificationFilter>("active");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  const listQuery = trpc.notification.list.useQuery(
    { status: filter, ...(typeFilter !== "all" ? { type: typeFilter } : {}) },
    { refetchInterval: 60_000 },
  );
  const countQuery = trpc.notification.count.useQuery(undefined, { refetchInterval: 60_000 });
  const historyQuery = trpc.notification.history.useQuery({ limit: 50 });
  const preferencesQuery = trpc.notification.preferences.useQuery();

  const refresh = () => {
    utils.notification.list.invalidate();
    utils.notification.count.invalidate();
    utils.notification.summary.invalidate();
    utils.notification.history.invalidate();
  };

  const generate = trpc.notification.generate.useMutation({
    onSuccess: (r) => {
      refresh();
      toaster.success(
        r.created > 0
          ? `${r.delivered} delivered · ${r.created} generated`
          : "No new notifications",
      );
      timeline.emit({
        kind: "notification.generated",
        source: "notification",
        title: "Notifications generated",
      });
      analytics.track({ kind: "notifications.generated", value: r.created });
    },
  });
  const dismissM = trpc.notification.dismiss.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "notification.dismissed", source: "notification", title: "Dismissed" });
      analytics.track({ kind: "notifications.dismissed", value: 1 });
    },
  });
  const completeM = trpc.notification.complete.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "notification.completed", source: "notification", title: "Completed" });
      analytics.track({ kind: "notifications.completed", value: 1 });
    },
  });
  const snoozeM = trpc.notification.snooze.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "notification.snoozed", source: "notification", title: "Snoozed" });
      analytics.track({ kind: "notifications.snoozed", value: 1 });
    },
  });
  const markSeenM = trpc.notification.markSeen.useMutation({ onSuccess: refresh });
  const updatePrefsM = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => utils.notification.preferences.invalidate(),
  });
  const dismissAllM = trpc.notification.dismissAll.useMutation({ onSuccess: refresh });
  const markAllReadM = trpc.notification.markAllRead.useMutation({ onSuccess: refresh });

  const notifications = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  return {
    filter,
    setFilter,
    typeFilter,
    setTypeFilter,
    notifications,
    count: countQuery.data ?? null,
    history: historyQuery.data ?? [],
    preferences: preferencesQuery.data ?? null,
    isLoading: listQuery.isLoading,

    generate: () => generate.mutate(),
    generating: generate.isPending,
    dismiss: (id: string) => dismissM.mutate({ id }),
    complete: (id: string) => completeM.mutate({ id }),
    markSeen: (id: string) => markSeenM.mutate({ id }),
    snooze: (id: string, window: ReminderWindow) => snoozeM.mutate({ id, window }),
    updatePreference: updatePrefsM.mutate,
    dismissAll: () => dismissAllM.mutate(),
    markAllRead: () => markAllReadM.mutate(),
  };
}

export type UseNotification = ReturnType<typeof useNotification>;
