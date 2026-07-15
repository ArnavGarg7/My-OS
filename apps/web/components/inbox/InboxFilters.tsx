"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@myos/ui";
import { CAPTURE_TYPES, type CaptureType, type InboxSort } from "@myos/core/inbox";
import { captureLabel } from "./inbox-icons";

/**
 * Inbox filters (Sprint 2.4). Status (new/archived), type, and sort. Suggestions
 * only — these never move items, they only shape the current view.
 */
export function InboxFilters({
  status,
  onStatus,
  type,
  onType,
  sort,
  onSort,
}: {
  status: "new" | "archived";
  onStatus: (status: "new" | "archived") => void;
  type: CaptureType | null;
  onType: (type: CaptureType | null) => void;
  sort: InboxSort;
  onSort: (sort: InboxSort) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={(v) => onStatus(v as "new" | "archived")}>
        <SelectTrigger className="w-32" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">Inbox</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={type ?? "all"}
        onValueChange={(v) => onType(v === "all" ? null : (v as CaptureType))}
      >
        <SelectTrigger className="w-36" aria-label="Filter by type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {CAPTURE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {captureLabel(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSort(v as InboxSort)}>
        <SelectTrigger className="w-32" aria-label="Sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
