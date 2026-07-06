"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePersistentState } from "../hooks/use-persistent-state";
import { STORAGE_KEYS } from "../persistence";

interface InspectorState {
  open: boolean;
  width: number;
}

const DEFAULT_INSPECTOR: InspectorState = { open: false, width: 340 };

interface WorkspaceContextValue {
  inspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  inspectorWidth: number;
  setInspectorWidth: (width: number) => void;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  toggleFocusMode: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/**
 * WorkspaceProvider — per-workspace layout state (inspector open/width, focus
 * mode). Inspector state is persisted; focus mode is ephemeral.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [inspector, setInspector] = usePersistentState<InspectorState>(
    STORAGE_KEYS.inspector,
    DEFAULT_INSPECTOR,
  );
  const [focusMode, setFocusMode] = useState(false);

  const setInspectorOpen = useCallback(
    (open: boolean) => setInspector((prev) => ({ ...prev, open })),
    [setInspector],
  );
  const toggleInspector = useCallback(
    () => setInspector((prev) => ({ ...prev, open: !prev.open })),
    [setInspector],
  );
  const setInspectorWidth = useCallback(
    (width: number) => setInspector((prev) => ({ ...prev, width })),
    [setInspector],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      inspectorOpen: inspector.open,
      setInspectorOpen,
      toggleInspector,
      inspectorWidth: inspector.width,
      setInspectorWidth,
      focusMode,
      setFocusMode,
      toggleFocusMode: () => setFocusMode((f) => !f),
    }),
    [
      inspector.open,
      inspector.width,
      setInspectorOpen,
      toggleInspector,
      setInspectorWidth,
      focusMode,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within <AppProvider>");
  return ctx;
}
