"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Download,
  Info,
  RefreshCw,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useInstall, useNotifications, useUpdates } from "@/lib/platform";

/**
 * Platform command group (Sprint 1.7). Registration only — exposes install /
 * update / notification / reload actions through the Command Center. No feature
 * logic. Mount once inside the shell.
 */
export function PlatformCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const install = useInstall();
  const updates = useUpdates();
  const notifications = useNotifications();

  const groups = useMemo<CommandGroup[]>(
    () => [
      {
        id: "platform",
        title: "Platform",
        category: "platform",
        priority: 15,
        commands: [
          {
            id: "platform:install",
            title: "Install My OS",
            subtitle: "Add My OS to your device",
            category: "platform",
            icon: Download,
            keywords: ["install", "pwa", "app", "add"],
            visible: () => install.canInstall,
            execute: async (ctx) => {
              ctx.close();
              const outcome = await install.promptInstall();
              if (outcome === "unavailable") toaster.info("Install isn’t available right now");
            },
          },
          {
            id: "platform:check-updates",
            title: "Check for Updates",
            category: "platform",
            icon: RefreshCw,
            keywords: ["update", "version", "refresh"],
            execute: async (ctx) => {
              ctx.close();
              await updates.checkForUpdates();
              toaster.info(updates.updateAvailable ? "Update available" : "You're up to date");
            },
          },
          {
            id: "platform:reload",
            title: "Reload Application",
            category: "platform",
            icon: RotateCw,
            keywords: ["reload", "restart", "refresh"],
            execute: (ctx) => {
              ctx.close();
              window.location.reload();
            },
          },
          {
            id: "platform:enable-notifications",
            title: "Enable Notifications",
            category: "platform",
            icon: Bell,
            keywords: ["notifications", "alerts", "permission"],
            visible: () => notifications.supported && notifications.permission !== "granted",
            execute: async (ctx) => {
              ctx.close();
              const result = await notifications.request();
              if (result === "granted") toaster.success("Notifications enabled");
              else if (result === "denied")
                toaster.warning("Notifications are blocked in your browser");
            },
          },
          {
            id: "platform:disable-notifications",
            title: "Disable Notifications",
            category: "platform",
            icon: BellOff,
            keywords: ["notifications", "mute", "off"],
            visible: () => notifications.permission === "granted",
            execute: (ctx) => {
              ctx.close();
              toaster.info("Turn notifications off in your browser's site settings");
            },
          },
          {
            id: "platform:app-info",
            title: "View App Information",
            category: "platform",
            icon: Info,
            keywords: ["about", "version", "diagnostics", "info"],
            execute: (ctx) => {
              ctx.close();
              router.push("/settings");
            },
          },
          {
            id: "platform:browser-settings",
            title: "Open Browser Settings",
            category: "platform",
            icon: SlidersHorizontal,
            keywords: ["browser", "permissions", "settings"],
            execute: (ctx) => {
              ctx.close();
              toaster.info("Open your browser's site settings to manage permissions");
            },
          },
        ],
      },
    ],
    [router, toaster, install, updates, notifications],
  );

  useRegisterGroups(groups);
  return null;
}
