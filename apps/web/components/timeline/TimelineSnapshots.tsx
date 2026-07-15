"use client";

import { CalendarRange } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

const TYPE_LABEL: Record<string, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

/**
 * TimelineSnapshots (Sprint 2.13). Weekly/monthly/quarterly/yearly rollups from
 * `timeline.snapshots` — pure aggregation, no narrative text.
 */
export function TimelineSnapshots() {
  const snapshots = trpc.timeline.snapshots.useQuery();
  const data = snapshots.data ?? [];

  if (data.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Reviews will summarise your activity by period.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((s) => (
        <li key={s.snapshotType} className="flex items-start gap-2">
          <CalendarRange size={14} aria-hidden className="text-fg-subtle mt-0.5 shrink-0" />
          <div className="min-w-0">
            <Text variant="body-s">{TYPE_LABEL[s.snapshotType] ?? s.snapshotType}</Text>
            <Text variant="caption" tone="subtle">
              {s.summary}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}
