import "server-only";
import type { InboxItem } from "@myos/core/inbox";
import type { InboxItemRow } from "@myos/db/schema";

/**
 * Inbox row ↔ DTO mapping (Sprint 2.4). Timestamps become ISO strings for the
 * pure engine + the client; the engine never sees Date objects.
 */
export function rowToItem(row: InboxItemRow): InboxItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: row.metadata ?? {},
    status: row.status,
    source: row.source,
    capturedAt: row.capturedAt.toISOString(),
    organizedAt: row.organizedAt ? row.organizedAt.toISOString() : null,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The mutable columns for an item (used by insert + update). */
export function itemToColumns(item: InboxItem) {
  return {
    type: item.type,
    title: item.title,
    content: item.content,
    metadata: item.metadata,
    status: item.status,
    source: item.source,
    capturedAt: new Date(item.capturedAt),
    organizedAt: item.organizedAt ? new Date(item.organizedAt) : null,
    archivedAt: item.archivedAt ? new Date(item.archivedAt) : null,
    deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    updatedAt: new Date(item.updatedAt),
  };
}
