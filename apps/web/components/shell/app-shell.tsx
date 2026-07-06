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

      {/* Command Center: register built-in + platform commands + mount the palette */}
      <BuiltinCommands />
      <PlatformCommands />
      <CommandPalette />

      {/* Overlays */}
      <MobileNav />
      <QuickAddDialog />
    </div>
  );
}
