"use client";

import { ArrowRight } from "lucide-react";
import { nextTaskBlock, taskBlocks, type PlannerBlock } from "@myos/core/planner";
import { Text } from "@myos/ui";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Planner recommendations (Sprint 2.6). Surfaces what to do next from the
 * generated timeline — the next task block and the ordered work ahead.
 */
export function PlannerRecommendations({
  blocks,
  now,
  onSelect,
}: {
  blocks: PlannerBlock[];
  now: Date;
  onSelect: (id: string) => void;
}) {
  const next = nextTaskBlock(blocks, now);
  const ahead = taskBlocks(blocks)
    .filter((b) => new Date(b.startTime).getTime() > now.getTime())
    .slice(0, 4);

  if (!next) {
    return (
      <Text variant="body-s" tone="subtle">
        No upcoming work. Generate or add tasks to see recommendations.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onSelect(next.id)}
        className="border-accent bg-accent-muted/30 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left outline-none"
      >
        <span className="min-w-0">
          <span className="text-caption text-accent block">Up next</span>
          <span className="text-body-m text-fg block truncate font-medium">{next.title}</span>
        </span>
        <span className="text-accent flex shrink-0 items-center gap-1 tabular-nums">
          {time(next.startTime)}
          <ArrowRight size={14} aria-hidden />
        </span>
      </button>

      {ahead.length > 1 ? (
        <ul className="flex flex-col gap-1">
          {ahead.slice(1).map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                className="hover:bg-elevated flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
              >
                <span className="text-caption text-fg-subtle w-12 shrink-0 tabular-nums">
                  {time(b.startTime)}
                </span>
                <span className="text-body-s text-fg-muted truncate">{b.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
