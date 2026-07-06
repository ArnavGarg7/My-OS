"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  LogOut,
  Moon,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sun,
  SunMoon,
  User,
} from "lucide-react";
import { useTheme } from "@myos/ui";
import { NAV_ITEMS } from "@/lib/shell/nav";
import { useShellStore } from "@/lib/shell/store";
import { useIdentity } from "@/lib/identity";
import { useRegisterGroups } from "@/lib/command-center";
import type { Command, CommandGroup } from "@/lib/command-center";

/**
 * Built-in command groups (Sprint 1.6): Navigation, Appearance, System, Account,
 * Developer. Registered via the Command Center. Mount once inside the shell.
 * Renders nothing — it only registers commands for the component's lifetime.
 */
export function BuiltinCommands() {
  const router = useRouter();
  const { setTheme, toggle } = useTheme();
  const { signOut } = useIdentity();

  const groups = useMemo<CommandGroup[]>(() => {
    const navigation: Command[] = NAV_ITEMS.map((item, index) => ({
      id: `nav:${item.href}`,
      title: `Open ${item.label}`,
      subtitle: item.description,
      category: "navigation",
      icon: item.icon,
      keywords: [item.label, item.href, "go to", "open", "navigate"],
      priority: 100 - index,
      execute: (ctx) => {
        ctx.close();
        router.push(item.href);
      },
    }));

    const appearance: Command[] = [
      {
        id: "appearance:toggle-theme",
        title: "Toggle Theme",
        subtitle: "Switch between light and dark",
        category: "appearance",
        icon: SunMoon,
        keywords: ["theme", "dark", "light", "mode"],
        priority: 30,
        execute: (ctx) => {
          ctx.close();
          toggle();
        },
      },
      {
        id: "appearance:dark",
        title: "Switch to Dark Mode",
        category: "appearance",
        icon: Moon,
        keywords: ["theme", "dark", "night"],
        priority: 20,
        execute: (ctx) => {
          ctx.close();
          setTheme("dark");
        },
      },
      {
        id: "appearance:light",
        title: "Switch to Light Mode",
        category: "appearance",
        icon: Sun,
        keywords: ["theme", "light", "day"],
        priority: 10,
        execute: (ctx) => {
          ctx.close();
          setTheme("light");
        },
      },
    ];

    const system: Command[] = [
      {
        id: "system:collapse-sidebar",
        title: "Collapse Sidebar",
        category: "system",
        icon: PanelLeftClose,
        keywords: ["sidebar", "hide", "narrow"],
        priority: 30,
        enabled: () => !useShellStore.getState().collapsed,
        execute: (ctx) => {
          ctx.close();
          useShellStore.getState().setCollapsed(true);
        },
      },
      {
        id: "system:expand-sidebar",
        title: "Expand Sidebar",
        category: "system",
        icon: PanelLeftOpen,
        keywords: ["sidebar", "show", "wide"],
        priority: 20,
        enabled: () => useShellStore.getState().collapsed,
        execute: (ctx) => {
          ctx.close();
          useShellStore.getState().setCollapsed(false);
        },
      },
      {
        id: "system:toggle-sidebar",
        title: "Toggle Sidebar",
        category: "system",
        icon: PanelLeft,
        shortcut: "⌘B",
        keywords: ["sidebar", "collapse", "expand"],
        priority: 10,
        execute: (ctx) => {
          ctx.close();
          useShellStore.getState().toggleCollapsed();
        },
      },
      {
        id: "system:quick-add",
        title: "Open Quick Add",
        category: "system",
        icon: Plus,
        keywords: ["new", "create", "add", "capture"],
        priority: 5,
        execute: (ctx) => {
          ctx.close();
          useShellStore.getState().setQuickAddOpen(true);
        },
      },
    ];

    const account: Command[] = [
      {
        id: "account:profile",
        title: "Open Profile",
        category: "account",
        icon: User,
        keywords: ["profile", "account", "me"],
        priority: 30,
        execute: (ctx) => {
          ctx.close();
          router.push("/profile");
        },
      },
      {
        id: "account:preferences",
        title: "Open Preferences",
        category: "account",
        icon: Settings,
        keywords: ["preferences", "settings", "options"],
        priority: 20,
        execute: (ctx) => {
          ctx.close();
          router.push("/settings");
        },
      },
      {
        id: "account:sign-out",
        title: "Sign Out",
        category: "account",
        icon: LogOut,
        keywords: ["sign out", "logout", "log out", "exit"],
        priority: 10,
        meta: { destructive: true },
        execute: (ctx) => {
          ctx.close();
          void signOut();
        },
      },
    ];

    const developer: Command[] = [
      {
        id: "developer:showcase",
        title: "Open Showcase",
        subtitle: "Design system reference",
        category: "developer",
        icon: FlaskConical,
        keywords: ["showcase", "design", "components", "dev"],
        execute: (ctx) => {
          ctx.close();
          router.push("/showcase");
        },
      },
    ];

    return [
      {
        id: "navigation",
        title: "Navigation",
        category: "navigation",
        priority: 100,
        commands: navigation,
      },
      {
        id: "appearance",
        title: "Appearance",
        category: "appearance",
        priority: 80,
        commands: appearance,
      },
      { id: "system", title: "System", category: "system", priority: 60, commands: system },
      { id: "account", title: "Account", category: "account", priority: 40, commands: account },
      {
        id: "developer",
        title: "Developer",
        category: "developer",
        priority: 20,
        commands: developer,
      },
    ];
  }, [router, setTheme, toggle, signOut]);

  useRegisterGroups(groups);
  return null;
}
