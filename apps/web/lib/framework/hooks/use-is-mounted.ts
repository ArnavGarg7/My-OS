"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Returns a stable getter for the mounted state — use it to guard async work
 * from updating an unmounted component.
 */
export function useIsMounted(): () => boolean {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return useCallback(() => mounted.current, []);
}

/** Boolean form — `false` on the server / first render, `true` after mount. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
