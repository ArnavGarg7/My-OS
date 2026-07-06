"use client";

import { useShellStore } from "@/lib/shell/store";

/**
 * Control the Command Center (Sprint 1.4). Integrates with the shell store from
 * Sprint 1.3 rather than owning separate state.
 */
export function useCommandCenter(): {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  openCommandCenter: () => void;
  closeCommandCenter: () => void;
} {
  const open = useShellStore((state) => state.commandOpen);
  const setOpen = useShellStore((state) => state.setCommandOpen);
  const toggle = useShellStore((state) => state.toggleCommand);
  return {
    open,
    setOpen,
    toggle,
    openCommandCenter: () => setOpen(true),
    closeCommandCenter: () => setOpen(false),
  };
}
