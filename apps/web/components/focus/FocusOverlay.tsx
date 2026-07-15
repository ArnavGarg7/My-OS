"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { UseFocus } from "./use-focus";
import { FocusWorkspace } from "./FocusWorkspace";

/**
 * FocusOverlay (Sprint 3.2). Fullscreen distraction-free mode. Rendered via a portal
 * to document.body so it covers the ENTIRE shell (sidebar, status bar, context panel,
 * navigation) — a `fixed` element alone is trapped by the shell's transformed
 * ancestors. Escape exits. Reuses FocusWorkspace verbatim.
 */
export function FocusOverlay({ focus }: { focus: UseFocus }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") focus.setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const overlay = (
    <div className="bg-base fixed inset-0 z-[100] overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center p-6 sm:p-10">
        <FocusWorkspace focus={focus} />
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}
