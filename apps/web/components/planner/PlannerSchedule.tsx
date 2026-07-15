"use client";

import { Text } from "@myos/ui";
import { sortBlocks, type PlannerBlock } from "@myos/core/planner";
import { BLOCK_DOT } from "./planner-icons";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Compact schedule list (Sprint 2.6). A dense read-only view of the timeline. */
export function PlannerSchedule({ blocks }: { blocks: PlannerBlock[] }) {
  if (blocks.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Nothing scheduled.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {sortBlocks(blocks).map((b) => (
        <li key={b.id} className="flex items-center gap-2">
          <span className="text-caption text-fg-subtle w-12 shrink-0 tabular-nums">
            {time(b.startTime)}
          </span>
          <span aria-hidden className={`size-1.5 rounded-full ${BLOCK_DOT[b.type]}`} />
          <span className="text-body-s text-fg-muted truncate">{b.title}</span>
        </li>
      ))}
    </ul>
  );
}
