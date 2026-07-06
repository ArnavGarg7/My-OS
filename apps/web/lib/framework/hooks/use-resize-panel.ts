"use client";

import { useCallback, useState } from "react";
import type { StorageKey } from "../persistence";
import { usePersistentState } from "./use-persistent-state";

export type ResizeEdge = "left" | "right" | "top" | "bottom";

export interface ResizePanelOptions {
  initial: number;
  min: number;
  max: number;
  /** Which edge the drag handle lives on (determines delta sign/axis). */
  edge?: ResizeEdge;
  /** Persist the size under this key. */
  storageKey?: StorageKey;
}

export interface ResizePanel {
  size: number;
  setSize: (size: number) => void;
  isResizing: boolean;
  /** Spread onto the drag handle element. */
  handleProps: { onPointerDown: (event: React.PointerEvent) => void };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Generic resizable-panel logic (Sprint 1.4). Powers ResizablePanel /
 * InspectorPanel / SplitLayout. Optionally persists the size.
 */
export function useResizePanel(options: ResizePanelOptions): ResizePanel {
  const { initial, min, max, edge = "right", storageKey } = options;

  // Two hooks are always called; the unused one is inert.
  const persistent = usePersistentState<number>(storageKey ?? "myos-panel-widths", initial);
  const local = useState<number>(initial);
  const [rawSize, setRawSizeState] = storageKey ? persistent : local;
  const [isResizing, setIsResizing] = useState(false);

  const setSize = useCallback(
    (next: number) => setRawSizeState(clamp(next, min, max)),
    [setRawSizeState, min, max],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const horizontal = edge === "left" || edge === "right";
      const start = horizontal ? event.clientX : event.clientY;
      const startSize = clamp(rawSize, min, max);
      setIsResizing(true);
      document.body.style.cursor = horizontal ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      const onMove = (moveEvent: PointerEvent) => {
        const pos = horizontal ? moveEvent.clientX : moveEvent.clientY;
        const sign = edge === "right" || edge === "bottom" ? 1 : -1;
        setRawSizeState(clamp(startSize + sign * (pos - start), min, max));
      };
      const onUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [edge, rawSize, min, max, setRawSizeState],
  );

  return {
    size: clamp(rawSize, min, max),
    setSize,
    isResizing,
    handleProps: { onPointerDown },
  };
}
