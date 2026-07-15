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
  /** Preselected capture type when Quick Add opens (Sprint 2.4). */
  quickAddType: string | null;
  setQuickAddType: (type: string | null) => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  contextPanelOpen: boolean;
  setContextPanelOpen: (open: boolean) => void;
  toggleContextPanel: () => void;

  // Selected inbox item (Sprint 2.4) — drives the context panel viewer.
  selectedInboxId: string | null;
  setSelectedInboxId: (id: string | null) => void;

  // Selected task (Sprint 2.5) — drives the task context panel.
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  // Selected planner block (Sprint 2.6) — drives the planner inspector.
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;

  // Selected calendar event (Sprint 2.7) — drives the calendar inspector.
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  // Selected project (Sprint 2.8) — drives the project inspector / context panel.
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Selected journal entry (Sprint 2.10) — drives the journal context panel.
  selectedJournalId: string | null;
  setSelectedJournalId: (id: string | null) => void;

  // Selected finance account (Sprint 2.11) — drives the finance context panel.
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;

  // Selected goal (Sprint 2.12) — drives the goal context panel.
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;

  // Selected timeline event (Sprint 2.13) — drives the timeline inspector.
  selectedTimelineEventId: string | null;
  setSelectedTimelineEventId: (id: string | null) => void;

  // Selected analytics metric (Sprint 2.14) — drives the analytics context panel.
  selectedMetric: string | null;
  setSelectedMetric: (key: string | null) => void;

  // Active Tomorrow Studio step (Sprint 3.1) — drives the studio context panel.
  tomorrowStep: string;
  setTomorrowStep: (step: string) => void;

  // Focus Mode fullscreen (Sprint 3.2) — hides shell chrome for deep work.
  focusFullscreen: boolean;
  setFocusFullscreen: (on: boolean) => void;
  toggleFocusFullscreen: () => void;
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
      quickAddType: null,
      setQuickAddType: (quickAddType) => set({ quickAddType }),

      mobileNavOpen: false,
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),

      contextPanelOpen: false,
      setContextPanelOpen: (contextPanelOpen) => set({ contextPanelOpen }),
      toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),

      selectedInboxId: null,
      setSelectedInboxId: (selectedInboxId) => set({ selectedInboxId }),

      selectedTaskId: null,
      setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),

      selectedBlockId: null,
      setSelectedBlockId: (selectedBlockId) => set({ selectedBlockId }),

      selectedEventId: null,
      setSelectedEventId: (selectedEventId) => set({ selectedEventId }),

      selectedProjectId: null,
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),

      selectedJournalId: null,
      setSelectedJournalId: (selectedJournalId) => set({ selectedJournalId }),

      selectedAccountId: null,
      setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),

      selectedGoalId: null,
      setSelectedGoalId: (selectedGoalId) => set({ selectedGoalId }),

      selectedTimelineEventId: null,
      setSelectedTimelineEventId: (selectedTimelineEventId) => set({ selectedTimelineEventId }),

      selectedMetric: null,
      setSelectedMetric: (selectedMetric) => set({ selectedMetric }),

      tomorrowStep: "review",
      setTomorrowStep: (tomorrowStep) => set({ tomorrowStep }),

      focusFullscreen: false,
      setFocusFullscreen: (focusFullscreen) => set({ focusFullscreen }),
      toggleFocusFullscreen: () => set((state) => ({ focusFullscreen: !state.focusFullscreen })),
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
