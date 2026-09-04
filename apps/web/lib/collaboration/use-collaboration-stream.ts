"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

/**
 * Collaboration realtime (Stage 7). Subscribes to the SSE seam so shared-context changes
 * propagate live — no polling. On any event it invalidates the collaboration + notification
 * queries, so open surfaces (discussion, members, status-bar count) refresh without a manual
 * reload. Honest scope: within one server process this reaches the owner's own tabs; the
 * same client code consumes a future cross-process/second-user fan-out unchanged.
 */
export function useCollaborationStream(onEvent?: (event: { kind: string }) => void): void {
  const utils = trpc.useUtils();
  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    const source = new EventSource("/api/collaboration/stream");
    const handler = (e: MessageEvent) => {
      void utils.collaboration.invalidate();
      void utils.notification.count.invalidate();
      void utils.notification.active.invalidate();
      try {
        onEvent?.(JSON.parse(e.data) as { kind: string });
      } catch {
        /* ignore malformed */
      }
    };
    source.addEventListener("collab", handler as EventListener);
    return () => {
      source.removeEventListener("collab", handler as EventListener);
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
