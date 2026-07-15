"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  History,
  Play,
  Settings2,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/** Notification command group (Sprint 3.3). Registration only. Mount once. */
export function NotificationCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const refresh = () => {
    utils.notification.list.invalidate();
    utils.notification.count.invalidate();
  };
  const generate = trpc.notification.generate.useMutation({
    onSuccess: (r) => {
      refresh();
      toaster.success(r.created > 0 ? `${r.created} generated` : "No new notifications");
    },
  });
  const dismissAll = trpc.notification.dismissAll.useMutation({ onSuccess: refresh });
  const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: refresh });
  const updatePrefs = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => utils.notification.preferences.invalidate(),
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/notifications");
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `notification:${id}`,
      title,
      category: "notification",
      icon,
      keywords: ["notification", "alert", "reminder", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "notification",
        title: "Notifications",
        category: "notification",
        priority: 86,
        commands: [
          cmd("open", "Open Notifications", Bell, ["open", "center"], go),
          cmd("dismiss-all", "Dismiss All", Trash2, ["dismiss", "clear"], () =>
            dismissAll.mutate(),
          ),
          cmd("mark-read", "Mark All Read", CheckCheck, ["read"], () => markAllRead.mutate()),
          cmd("enable", "Enable Notifications", Play, ["enable", "unmute"], () =>
            updatePrefs.mutate({ muted: false }),
          ),
          cmd("disable", "Disable Notifications", BellOff, ["disable", "mute", "dnd"], () =>
            updatePrefs.mutate({ muted: true }),
          ),
          cmd("snooze-30", "Snooze 30 Minutes", Clock, ["snooze", "quiet"], () =>
            updatePrefs.mutate({ muted: true }),
          ),
          cmd("resume", "Resume Notifications", Play, ["resume"], () =>
            updatePrefs.mutate({ muted: false }),
          ),
          cmd(
            "preferences",
            "Notification Preferences",
            Settings2,
            ["preferences", "settings"],
            () => {
              go();
              openContextPanel(true);
            },
          ),
          cmd("history", "Notification History", History, ["history", "log"], () => go()),
          cmd("generate", "Generate Test Notification", Sparkles, ["generate", "test"], () =>
            generate.mutate(),
          ),
        ],
      },
    ];
  }, [router, dismissAll, markAllRead, updatePrefs, generate, openContextPanel]);

  useRegisterGroups(groups);
  return null;
}
