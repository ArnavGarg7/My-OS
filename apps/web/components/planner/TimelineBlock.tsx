"use client";

import { Lock } from "lucide-react";
import { cn } from "@myos/ui";
import type { PlannerBlock } from "@myos/core/planner";
import { BLOCK_ICON, BLOCK_LABEL, BLOCK_TONE } from "./planner-icons";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * A single timeline block (Sprint 2.6). Icon · title · time range, tinted by
 * type. Click selects (opens the inspector). Locked + overflow are flagged.
 */
export function TimelineBlock({
  block,
  selected,
  onSelect,
}: {
  block: PlannerBlock;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = BLOCK_ICON[block.type];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-block-type={block.type}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left outline-none transition-colors",
        BLOCK_TONE[block.type],
        selected ? "ring-accent ring-2" : "hover:brightness-105",
      )}
    >
      <span className="text-fg-muted shrink-0">
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-body-m text-fg truncate font-medium">{block.title}</span>
          {block.locked ? (
            <Lock size={12} aria-label="Locked" className="text-fg-subtle shrink-0" />
          ) : null}
        </span>
        <span className="text-caption text-fg-subtle">
          {BLOCK_LABEL[block.type]} · {time(block.startTime)}–{time(block.endTime)}
        </span>
      </span>
    </button>
  );
}
