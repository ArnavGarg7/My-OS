"use client";

import { PLANNER_BLOCK_TYPES, type PlannerBlockType } from "@myos/core/planner";
import { cn } from "@myos/ui";
import { BLOCK_DOT, BLOCK_LABEL } from "./planner-icons";

/**
 * Timeline type filters (Sprint 2.6). Toggle which block types are visible.
 * `null` visible set means "show all".
 */
export function PlannerFilters({
  visible,
  onToggle,
}: {
  visible: Set<PlannerBlockType> | null;
  onToggle: (type: PlannerBlockType) => void;
}) {
  const isOn = (t: PlannerBlockType) => visible === null || visible.has(t);
  return (
    <div className="flex flex-wrap gap-1.5">
      {PLANNER_BLOCK_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onToggle(type)}
          aria-pressed={isOn(type)}
          className={cn(
            "text-caption flex items-center gap-1.5 rounded-full border px-2.5 py-1 outline-none transition-colors",
            isOn(type) ? "border-border text-fg-muted" : "border-border text-fg-subtle opacity-50",
          )}
        >
          <span aria-hidden className={`size-2 rounded-full ${BLOCK_DOT[type]}`} />
          {BLOCK_LABEL[type]}
        </button>
      ))}
    </div>
  );
}
