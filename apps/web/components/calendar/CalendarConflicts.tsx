"use client";

import { AlertTriangle } from "lucide-react";
import { Text } from "@myos/ui";
import type { CalendarConflict } from "@myos/core/calendar";

/** Conflict list (Sprint 2.7). Deterministic problems; nothing auto-resolved. */
export function CalendarConflicts({ conflicts }: { conflicts: CalendarConflict[] }) {
  if (conflicts.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No conflicts. Your calendar is clean.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {conflicts.map((c, i) => (
        <li key={i} className="border-border flex items-start gap-2 rounded-md border px-3 py-2">
          <span className="text-warning mt-0.5 shrink-0">
            <AlertTriangle size={14} aria-hidden />
          </span>
          <span>
            <span className="text-caption text-fg-subtle block uppercase">
              {c.type.replace(/-/g, " ")}
            </span>
            <span className="text-body-s text-fg-muted">{c.message}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
