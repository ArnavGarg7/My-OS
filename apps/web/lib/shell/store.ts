import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const SIDEBAR_MIN_WIDTH = 208;
export const SIDEBAR_MAX_WIDTH = 320;
export const SIDEBAR_DEFAULT_WIDTH = 236;
export const SIDEBAR_RAIL_WIDTH = 56;

interface ShellState {
  // Persisted layout state (localStorage: "myos-sidebar").
  collapsed: boolean;
  width: number;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setWidth: (width: number) => void;

  // Ephemeral overlay state (reset every load).
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  contextPanelOpen: boolean;
  setContextPanelOpen: (open: boolean) => void;
  toggleContextPanel: () => void;
}

function clampWidth(width: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

/**
 * Shell UI state (04_System_Architecture.md §4 — Zustand for ephemeral UI state).
 * Only the sidebar collapsed/width is persisted; overlay flags are transient.
 * `skipHydration` avoids an SSR/CSR mismatch — the AppShell rehydrates on mount.
 */
export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      collapsed: false,
      width: SIDEBAR_DEFAULT_WIDTH,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setWidth: (width) => set({ width: clampWidth(width) }),

      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),

      quickAddOpen: false,
      setQuickAddOpen: (quickAddOpen) => set({ quickAddOpen }),

      mobileNavOpen: false,
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),

      contextPanelOpen: false,
      setContextPanelOpen: (contextPanelOpen) => set({ contextPanelOpen }),
      toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
    }),
    {
      name: "myos-sidebar",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ collapsed: state.collapsed, width: state.width }),
      skipHydration: true,
    },
  ),
);

// Rehydrate at client module-load — before any component effect can run a
// setter (which would otherwise persist the default state and clobber the saved
// value). Rendering stays gated on a `hydrated` flag to avoid an SSR mismatch.
if (typeof window !== "undefined") {
  void useShellStore.persist.rehydrate();
}
