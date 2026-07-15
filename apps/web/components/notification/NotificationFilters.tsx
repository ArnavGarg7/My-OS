"use client";

import { Button } from "@myos/ui";
import type { NotificationFilter } from "./use-notification";

/**
 * NotificationFilters (Sprint 3.3). Segmented control for the active/unread/queued/all
 * views. Deterministic — just drives the list query filter.
 */
const FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "unread", label: "Unread" },
  { key: "queued", label: "Queued" },
  { key: "all", label: "All" },
];

export function NotificationFilters({
  filter,
  onChange,
}: {
  filter: NotificationFilter;
  onChange: (f: NotificationFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((f) => (
        <Button
          key={f.key}
          size="sm"
          variant={filter === f.key ? "primary" : "ghost"}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}
