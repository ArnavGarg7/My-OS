"use client";

import { cn } from "@myos/ui";
import type { TaskStatus } from "@myos/core/task";

/**
 * Task facets (Sprint 2.5). Quick status filters with live counts — a compact
 * left rail rendered above the list on the Tasks page.
 */
const FACETS: { key: TaskStatus | null; label: string; count: (c: Counts) => number }[] = [
  { key: null, label: "All open", count: (c) => c.open },
  { key: "in_progress", label: "In progress", count: (c) => c.inProgress },
  { key: "blocked", label: "Blocked", count: (c) => c.blocked },
  { key: "completed", label: "Completed", count: (c) => c.completed },
];

interface Counts {
  open: number;
  inProgress: number;
  blocked: number;
  completed: number;
}

export function TaskSidebar({
  active,
  counts,
  onSelect,
}: {
  active: TaskStatus | null;
  counts: Counts;
  onSelect: (status: TaskStatus | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FACETS.map((f) => (
        <button
          key={f.label}
          type="button"
          onClick={() => onSelect(f.key)}
          aria-pressed={active === f.key}
          className={cn(
            "text-body-s flex items-center gap-1.5 rounded-full border px-3 py-1 outline-none transition-colors",
            active === f.key
              ? "border-accent bg-accent-muted/40 text-accent"
              : "border-border text-fg-muted hover:bg-elevated",
          )}
        >
          {f.label}
          <span className="text-fg-subtle tabular-nums">{f.count(counts)}</span>
        </button>
      ))}
    </div>
  );
}
