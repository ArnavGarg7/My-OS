"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Calls `handler` when a pointer/touch event occurs outside the referenced
 * element(s). Accepts one ref or an array (e.g. trigger + panel).
 */
export function useClickOutside<T extends HTMLElement>(
  refs: RefObject<T | null> | RefObject<T | null>[],
  handler: (event: PointerEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    const refList = Array.isArray(refs) ? refs : [refs];
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const inside = refList.some((ref) => ref.current?.contains(target));
      if (!inside) handlerRef.current(event);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [refs, enabled]);
}
