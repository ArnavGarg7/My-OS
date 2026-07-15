import "server-only";
import {
  DUPLICATE_WINDOW_MS,
  inboxEngine,
  suggestDestination,
  type CaptureResult,
  type CaptureSchemaInput,
  type Destination,
  type DestinationSuggestion,
  type InboxItem,
  type ListInboxInput,
  type SearchInboxInput,
} from "@myos/core/inbox";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { rowToItem } from "./mapper";

/**
 * InboxService (Sprint 2.4). Bridges the pure InboxEngine with persistence.
 * Capture detects duplicates against recent items (never auto-deletes); the
 * lifecycle mutations transition a single row.
 */
export async function capture(db: Database, input: CaptureSchemaInput): Promise<CaptureResult> {
  const now = new Date();
  const recent = (await repo.listRecent(db, new Date(now.getTime() - DUPLICATE_WINDOW_MS))).map(
    rowToItem,
  );
  const { item, duplicates } = inboxEngine.capture(
    {
      type: input.type,
      content: input.content,
      source: input.source,
      ...(input.title ? { title: input.title } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
    now,
    recent,
  );
  const saved = rowToItem(await repo.insert(db, item));
  return { item: saved, duplicates };
}

export async function list(db: Database, input: ListInboxInput): Promise<InboxItem[]> {
  const rows = await repo.list(db, input);
  return rows.map(rowToItem);
}

export async function get(db: Database, id: string): Promise<InboxItem> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Inbox item not found");
  return rowToItem(row);
}

async function transition(
  db: Database,
  id: string,
  apply: (item: InboxItem) => InboxItem,
): Promise<InboxItem> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Inbox item not found");
  const updated = apply(rowToItem(row));
  return rowToItem(await repo.update(db, id, updated));
}

export function archive(db: Database, id: string): Promise<InboxItem> {
  return transition(db, id, (item) => inboxEngine.archive(item, new Date()));
}

export function remove(db: Database, id: string): Promise<InboxItem> {
  return transition(db, id, (item) => inboxEngine.delete(item, new Date()));
}

export function restore(db: Database, id: string): Promise<InboxItem> {
  return transition(db, id, (item) => inboxEngine.restore(item, new Date()));
}

export function organize(db: Database, id: string, destination: Destination): Promise<InboxItem> {
  return transition(db, id, (item) => inboxEngine.organize(item, destination, new Date()));
}

export async function search(db: Database, input: SearchInboxInput): Promise<InboxItem[]> {
  const items = (await repo.listSearchable(db)).map(rowToItem);
  return inboxEngine.search(items, input);
}

export async function suggest(db: Database, id: string): Promise<DestinationSuggestion[]> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Inbox item not found");
  return suggestDestination(rowToItem(row));
}

/** Count of unprocessed (`new`) items — drives the status bar + overflow rule. */
export function countNew(db: Database): Promise<number> {
  return repo.countByStatus(db, "new");
}
