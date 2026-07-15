"use client";

import type { PlannerBlock } from "@myos/core/planner";
import { TimelineBlock } from "./TimelineBlock";

/**
 * One hour row of the editorial timeline (Sprint 2.6): the hour label on the
 * left, the blocks that start in that hour on the right.
 */
export function TimelineHour({
  hour,
  blocks,
  selectedId,
  onSelect,
}: {
  hour: number;
  blocks: PlannerBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const label = `${String(hour % 12 === 0 ? 12 : hour % 12)} ${hour < 12 ? "AM" : "PM"}`;
  return (
    <div className="flex gap-3 py-1">
      <div className="text-caption text-fg-subtle w-14 shrink-0 pt-2 text-right tabular-nums">
        {label}
      </div>
      <div className="border-border flex flex-1 flex-col gap-1.5 border-l pl-3">
        {blocks.length === 0 ? (
          <div className="h-6" aria-hidden />
        ) : (
          blocks.map((b) => (
            <TimelineBlock
              key={b.id}
              block={b}
              selected={b.id === selectedId}
              onSelect={() => onSelect(b.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
