"use client";

import { Button, cn } from "@myos/ui";
import {
  GROUPINGS,
  TIMELINE_SOURCES,
  type Grouping,
  type TimelineSource,
} from "@myos/core/timeline";
import { SOURCE_LABEL } from "./timeline-icons";

const GROUPING_LABEL: Record<Grouping, string> = {
  hour: "Hour",
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

/**
 * TimelineFilters (Sprint 2.13). Source toggles, grouping granularity + an
 * importance floor. All deterministic client-side view state — the server feed
 * re-filters to match.
 */
export function TimelineFilters({
  sources,
  onToggleSource,
  grouping,
  onGrouping,
  minImportance,
  onMinImportance,
  onClear,
}: {
  sources: TimelineSource[];
  onToggleSource: (s: TimelineSource) => void;
  grouping: Grouping;
  onGrouping: (g: Grouping) => void;
  minImportance: number;
  onMinImportance: (n: number) => void;
  onClear: () => void;
}) {
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-2.5 py-1 text-caption transition-colors",
      active
        ? "border-accent bg-accent/10 text-accent"
        : "border-border text-fg-subtle hover:text-fg",
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by source">
        {TIMELINE_SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={sources.includes(s)}
            className={chip(sources.includes(s))}
            onClick={() => onToggleSource(s)}
          >
            {SOURCE_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="group" aria-label="Group by">
          {GROUPINGS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={grouping === g}
              className={chip(grouping === g)}
              onClick={() => onGrouping(g)}
            >
              {GROUPING_LABEL[g]}
            </button>
          ))}
        </div>
        <label className="text-caption text-fg-subtle ml-auto flex items-center gap-2">
          Importance ≥ {minImportance}
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minImportance}
            onChange={(e) => onMinImportance(Number(e.target.value))}
            aria-label="Minimum importance"
          />
        </label>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
