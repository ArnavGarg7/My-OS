"use client";

import { useEffect } from "react";
import { useShellStore } from "./store";

/**
 * Global shortcut infrastructure (Sprint 1.3):
 *   ⌘/Ctrl + K  → toggle the Command Center
 *   ⌘/Ctrl + B  → collapse / expand the sidebar
 *   Esc         → close overlays (handled inside each Radix overlay)
 *
 * Only ⌘/Ctrl combos are registered here, so typing in inputs is unaffected.
 */
export function useKeyboardShortcuts(): void {
  const toggleCommand = useShellStore((state) => state.toggleCommand);
  const toggleCollapsed = useShellStore((state) => state.toggleCollapsed);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        toggleCommand();
      } else if (key === "b") {
        event.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCommand, toggleCollapsed]);
}
