"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Per-viewer pinned sidebar items (V2 IA pass). A small favorites row at the top of the sidebar so the
 * handful of surfaces someone actually lives in are one click away, independent of their group. Stored
 * in localStorage (best-effort, private to this browser) — a lightweight convenience, not shared state.
 */
const KEY = "myos.sidebar.pinned";

export function usePins() {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPinned(JSON.parse(raw) as string[]);
    } catch {
      /* storage unavailable — no pins is a fine default */
    }
  }, []);

  const toggle = useCallback((href: string) => {
    setPinned((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isPinned = useCallback((href: string) => pinned.includes(href), [pinned]);

  return { pinned, toggle, isPinned };
}
