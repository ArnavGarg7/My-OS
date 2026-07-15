import "server-only";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import type { Database } from "@myos/db";
import { inboxItems, type InboxItemRow } from "@myos/db/schema";
import { itemToColumns } from "./mapper";
import type { CaptureStatus, CaptureType, InboxItem } from "@myos/core/inbox";

/**
 * Inbox persistence (Sprint 2.4). Pure DB access over inbox_items. No business
 * logic — the service composes these with the pure InboxEngine.
 */
export async function list(
  db: Database,
  filter: {
    status?: CaptureStatus | undefined;
    type?: CaptureType | undefined;
    limit?: number | undefined;
  },
): Promise<InboxItemRow[]> {
  const conditions = [];
  if (filter.status) conditions.push(eq(inboxItems.status, filter.status));
  if (filter.type) conditions.push(eq(inboxItems.type, filter.type));
  const where = conditions.length ? and(...conditions) : undefined;
  return db
    .select()
    .from(inboxItems)
    .where(where)
    .orderBy(desc(inboxItems.capturedAt))
    .limit(filter.limit ?? 200);
}

/** All non-deleted items (bounded) — used for in-memory deterministic search. */
export function listSearchable(db: Database, limit = 500): Promise<InboxItemRow[]> {
  return db
    .select()
    .from(inboxItems)
    .where(ne(inboxItems.status, "deleted"))
    .orderBy(desc(inboxItems.capturedAt))
    .limit(limit);
}

/** Recent non-deleted items for duplicate detection within the capture window. */
export function listRecent(db: Database, since: Date): Promise<InboxItemRow[]> {
  return db
    .select()
    .from(inboxItems)
    .where(and(gte(inboxItems.capturedAt, since), ne(inboxItems.status, "deleted")))
    .orderBy(desc(inboxItems.capturedAt))
    .limit(200);
}

export async function getById(db: Database, id: string): Promise<InboxItemRow | undefined> {
  const [row] = await db.select().from(inboxItems).where(eq(inboxItems.id, id)).limit(1);
  return row;
}

export async function insert(db: Database, item: InboxItem): Promise<InboxItemRow> {
  const [row] = await db.insert(inboxItems).values(itemToColumns(item)).returning();
  if (!row) throw new Error("Failed to insert inbox_item");
  return row;
}

export async function update(db: Database, id: string, item: InboxItem): Promise<InboxItemRow> {
  const [row] = await db
    .update(inboxItems)
    .set(itemToColumns(item))
    .where(eq(inboxItems.id, id))
    .returning();
  if (!row) throw new Error("Failed to update inbox_item");
  return row;
}

export async function countByStatus(db: Database, status: CaptureStatus): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inboxItems)
    .where(eq(inboxItems.status, status));
  return row?.count ?? 0;
}
