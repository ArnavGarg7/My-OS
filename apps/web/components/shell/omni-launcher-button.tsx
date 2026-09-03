"use client";

import { Search } from "lucide-react";
import { Kbd, Text } from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";

/**
 * The Omni Launcher trigger in the sidebar (V2 Stage 1). Opens the command
 * surface — navigation, search, quick capture and contextual actions — the same
 * palette bound to ⌘K. A command layer for My OS, one keystroke away.
 */
export function OmniLauncherButton({ collapsed = false }: { collapsed?: boolean }) {
  const setCommandOpen = useShellStore((state) => state.setCommandOpen);

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label="Open Omni Launcher"
        onClick={() => setCommandOpen(true)}
        className="bg-elevated text-fg-muted hover:bg-overlay hover:text-fg focus-visible:ring-ring mx-auto flex size-8 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2"
      >
        <Search size={15} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setCommandOpen(true)}
      className="border-border bg-elevated hover:bg-overlay focus-visible:ring-ring group flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 outline-none transition-colors focus-visible:ring-2"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Search
          size={14}
          aria-hidden
          className="text-fg-subtle group-hover:text-fg-muted shrink-0"
        />
        <Text variant="body-s" tone="muted" className="truncate">
          Omni Launcher
        </Text>
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        <Kbd size="sm">⌘</Kbd>
        <Kbd size="sm">K</Kbd>
      </span>
    </button>
  );
}
