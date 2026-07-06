"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useShellStore } from "@/lib/shell/store";

/**
 * LayoutProvider — a facade over the shell store (Sprint 1.3) so feature modules
 * read/write global layout via `useLayout()` instead of importing the store
 * directly. Keeps the shell as the single owner of that state.
 */
interface LayoutContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  contextPanelOpen: boolean;
  toggleContextPanel: () => void;
  setContextPanelOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const sidebarCollapsed = useShellStore((s) => s.collapsed);
  const toggleSidebar = useShellStore((s) => s.toggleCollapsed);
  const setSidebarCollapsed = useShellStore((s) => s.setCollapsed);
  const contextPanelOpen = useShellStore((s) => s.contextPanelOpen);
  const toggleContextPanel = useShellStore((s) => s.toggleContextPanel);
  const setContextPanelOpen = useShellStore((s) => s.setContextPanelOpen);

  const value = useMemo<LayoutContextValue>(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      contextPanelOpen,
      toggleContextPanel,
      setContextPanelOpen,
    }),
    [
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      contextPanelOpen,
      toggleContextPanel,
      setContextPanelOpen,
    ],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within <AppProvider>");
  return ctx;
}
