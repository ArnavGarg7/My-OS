import { sortItems } from "./engine";
import type { CaptureStatus } from "./constants";
import type { InboxItem, InboxSort } from "./types";

/**
 * Inbox selectors (Sprint 2.4). Pure read helpers over a list of items — the UI
 * and server derive views from these instead of re-querying.
 */

export function selectByStatus(items: InboxItem[], status: CaptureStatus): InboxItem[] {
  return items.filter((item) => item.status === status);
}

/** The active inbox — everything still `new` (uncategorized). */
export function selectNew(items: InboxItem[], sort: InboxSort = "newest"): InboxItem[] {
  return sortItems(selectByStatus(items, "new"), sort);
}

export function selectArchived(items: InboxItem[]): InboxItem[] {
  return selectByStatus(items, "archived");
}

/** Count of unprocessed items — drives the status bar + inbox-overflow rule. */
export function countNew(items: InboxItem[]): number {
  return selectByStatus(items, "new").length;
}

export function selectItem(items: InboxItem[], id: string): InboxItem | null {
  return items.find((item) => item.id === id) ?? null;
}

/** Group counts by status, for filters + toolbar badges. */
export function statusCounts(items: InboxItem[]): Record<CaptureStatus, number> {
  const counts: Record<CaptureStatus, number> = {
    new: 0,
    organized: 0,
    archived: 0,
    deleted: 0,
  };
  for (const item of items) counts[item.status] += 1;
  return counts;
}
