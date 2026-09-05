"use client";

import { useEffect, type ReactNode } from "react";
import { dehydrate, hydrate, useQueryClient } from "@tanstack/react-query";
import { kvGet, kvSet } from "./idb";

/**
 * Query-cache persistence (Stage 8) — makes offline READS survive a refresh/reopen. On
 * mount it hydrates the React Query cache from IndexedDB (so a cold offline load shows the
 * last-known Command Center / Today / Tasks etc.), then throttle-persists successful
 * queries back. No new dependency (React Query's own dehydrate/hydrate). SECURITY: only
 * the same read models already shown in the UI are cached; no secrets/tokens ever enter
 * the cache, and APIs stay network-only in the service worker so nothing is double-cached.
 */
const CACHE_KEY = "query-cache";
const THROTTLE_MS = 3000;

export function QueryPersistence({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Hydrate last-known data first so an offline cold start isn't blank.
    void kvGet<ReturnType<typeof dehydrate>>(CACHE_KEY).then((snapshot) => {
      if (!cancelled && snapshot) {
        try {
          hydrate(queryClient, snapshot);
        } catch {
          /* stale/incompatible snapshot — ignore, fetch fresh */
        }
      }
    });

    const flush = () => {
      timer = null;
      try {
        void kvSet(CACHE_KEY, dehydrate(queryClient));
      } catch {
        /* best-effort */
      }
    };
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (timer) return;
      timer = setTimeout(flush, THROTTLE_MS);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [queryClient]);

  return <>{children}</>;
}
