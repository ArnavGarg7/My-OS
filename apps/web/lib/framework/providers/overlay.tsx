"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@myos/ui";

export interface OverlayOptions {
  side?: "left" | "right" | "bottom";
  title?: string;
  description?: string;
}

interface OverlayState {
  content: ReactNode;
  options: OverlayOptions;
}

interface OverlayContextValue {
  open: (content: ReactNode, options?: OverlayOptions) => void;
  close: () => void;
  isOpen: boolean;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * OverlayProvider — the Overlay Manager. Open arbitrary content in a slide-over
 * drawer imperatively, from anywhere: `useOverlay().open(<Filters/>)`.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState | null>(null);

  const open = useCallback((content: ReactNode, options: OverlayOptions = {}) => {
    setState({ content, options });
  }, []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo<OverlayContextValue>(
    () => ({ open, close, isOpen: state !== null }),
    [open, close, state],
  );

  return (
    <OverlayContext.Provider value={value}>
      {children}
      <Drawer
        open={state !== null}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {state ? (
          <DrawerContent side={state.options.side ?? "right"}>
            <DrawerTitle className={state.options.title ? "" : "sr-only"}>
              {state.options.title ?? "Panel"}
            </DrawerTitle>
            {state.options.description ? (
              <DrawerDescription>{state.options.description}</DrawerDescription>
            ) : null}
            {state.content}
          </DrawerContent>
        ) : null}
      </Drawer>
    </OverlayContext.Provider>
  );
}

export function useOverlay(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within <AppProvider>");
  return ctx;
}
