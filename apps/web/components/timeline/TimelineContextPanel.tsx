"use client";

import { Clock } from "lucide-react";
import { Text } from "@myos/ui";
import { neighbors as neighborsOf, relatedTo, byId } from "@myos/core/timeline";
import { trpc } from "@/lib/trpc/client";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { TimelineInspector } from "./TimelineInspector";

/**
 * Timeline context panel (Sprint 2.13). With an event selected, shows its
 * inspector (neighbours + related + pin); otherwise a compact statistics
 * snapshot of the whole history.
 */
export function TimelineContextPanel() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const selectedId = useShellStore((s) => s.selectedTimelineEventId);
  const setSelectedId = useShellStore((s) => s.setSelectedTimelineEventId);

  const feed = trpc.timeline.feed.useQuery({ grouping: "day", limit: 500 });
  const stats = trpc.timeline.statistics.useQuery(undefined, { enabled: !selectedId });
  const pin = trpc.timeline.pinMemory.useMutation({
    onSuccess: () => {
      utils.timeline.memories.invalidate();
      toaster.success("Pinned to memories");
    },
  });

  const events = feed.data?.events ?? [];
  const selected = selectedId ? byId(events, selectedId) : null;

  if (selected) {
    return (
      <TimelineInspector
        event={selected}
        neighbors={neighborsOf(events, selected.id)}
        related={relatedTo(events, selected)}
        onSelect={setSelectedId}
        onPin={(id) => pin.mutate({ eventId: id })}
        pinning={pin.isPending}
      />
    );
  }

  const s = stats.data;
  return (
    <div className="flex flex-col gap-3 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Clock size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Timeline</Text>
      </span>
      {s ? (
        <div className="flex flex-col gap-1">
          <Text variant="body-s">
            {s.totalEvents} events · {s.activeDays} active days
          </Text>
          <Text variant="caption" tone="subtle">
            {s.memorableCount} memorable · ~{s.averagePerActiveDay}/active day
          </Text>
          {s.busiestDay && (
            <Text variant="caption" tone="subtle">
              Busiest: {s.busiestDay.date} ({s.busiestDay.count})
            </Text>
          )}
        </div>
      ) : (
        <Text variant="body-s" tone="subtle">
          Select an event to inspect it, its neighbours and related history.
        </Text>
      )}
    </div>
  );
}
