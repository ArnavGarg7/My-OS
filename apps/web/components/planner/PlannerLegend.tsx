"use client";

import { PLANNER_BLOCK_TYPES } from "@myos/core/planner";
import { BLOCK_DOT, BLOCK_LABEL } from "./planner-icons";

/** Block-type legend (Sprint 2.6). Presentational. */
export function PlannerLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {PLANNER_BLOCK_TYPES.map((type) => (
        <span key={type} className="flex items-center gap-1.5">
          <span aria-hidden className={`size-2 rounded-full ${BLOCK_DOT[type]}`} />
          <span className="text-caption text-fg-subtle">{BLOCK_LABEL[type]}</span>
        </span>
      ))}
    </div>
  );
}
