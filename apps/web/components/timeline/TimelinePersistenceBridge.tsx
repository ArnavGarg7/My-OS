"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { TimelineSource } from "@myos/core/timeline";
import { useTimeline } from "@/lib/timeline";
import type {
  TimelineEvent as ClientTimelineEvent,
  TimelineSource as ClientSource,
} from "@/lib/timeline";
import { trpc } from "@/lib/trpc/client";

/**
 * TimelinePersistenceBridge (Sprint 2.13). Subscribes to the client
 * `TimelineEmitter` (Sprint 2.8.5) and appends every emitted event to the
 * durable `timeline_events` store via `timeline.record`. This is how the
 * ephemeral cross-engine stream becomes the permanent, immutable history —
 * without touching any module's emit call. Normalises the legacy "morning"
 * source onto "today" (the canonical timeline source).
 */
const SOURCE_MAP: Partial<Record<ClientSource, TimelineSource>> = { morning: "today" };

function normalizeSource(source: ClientSource): TimelineSource {
  return SOURCE_MAP[source] ?? (source as TimelineSource);
}

export function TimelinePersistenceBridge({ children }: { children: ReactNode }) {
  const timeline = useTimeline();
  const utils = trpc.useUtils();
  const record = trpc.timeline.record.useMutation({
    onSuccess: () => {
      utils.timeline.counts.invalidate();
      utils.timeline.feed.invalidate();
    },
  });
  // Keep a stable reference so the subscription effect runs once.
  const recordRef = useRef(record.mutate);
  recordRef.current = record.mutate;

  useEffect(() => {
    return timeline.subscribe((event: ClientTimelineEvent) => {
      const entityId =
        event.meta && typeof event.meta["id"] === "string" ? (event.meta["id"] as string) : null;
      recordRef.current({
        eventType: event.kind,
        source: normalizeSource(event.source),
        title: event.title,
        entityId,
        timestamp: event.at,
        ...(event.meta ? { metadata: event.meta } : {}),
      });
    });
  }, [timeline]);

  return <>{children}</>;
}
