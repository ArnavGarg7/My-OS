import "server-only";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  dailyReflections,
  journalEntries,
  journalLinks,
  journalReviews,
  type DailyReflectionRow,
  type JournalEntryInsert,
  type JournalEntryRow,
  type JournalLinkRow,
  type JournalReviewRow,
} from "@myos/db/schema";

/**
 * Journal persistence (Sprint 2.10). Pure DB access over the four journal
 * tables. No business logic — the service composes these with the pure engine.
 */
export function listEntries(db: Database, includeArchived = false): Promise<JournalEntryRow[]> {
  const where = includeArchived ? undefined : eq(journalEntries.archived, false);
  return db
    .select()
    .from(journalEntries)
    .where(where)
    .orderBy(desc(journalEntries.createdAt))
    .limit(500);
}

export async function getEntry(db: Database, id: string): Promise<JournalEntryRow | undefined> {
  const [row] = await db.select().from(journalEntries).where(eq(journalEntries.id, id)).limit(1);
  return row;
}

export async function insertEntry(
  db: Database,
  values: JournalEntryInsert,
): Promise<JournalEntryRow> {
  const [row] = await db.insert(journalEntries).values(values).returning();
  if (!row) throw new Error("Failed to insert journal entry");
  return row;
}

export async function updateEntry(
  db: Database,
  id: string,
  patch: Partial<JournalEntryRow>,
): Promise<JournalEntryRow> {
  const [row] = await db
    .update(journalEntries)
    .set(patch)
    .where(eq(journalEntries.id, id))
    .returning();
  if (!row) throw new Error("Journal entry not found");
  return row;
}

export async function deleteEntry(db: Database, id: string): Promise<void> {
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
}

// --- links ---
export function listLinks(db: Database): Promise<JournalLinkRow[]> {
  return db.select().from(journalLinks);
}

export function linksForEntries(db: Database, entryIds: string[]): Promise<JournalLinkRow[]> {
  if (entryIds.length === 0) return Promise.resolve([]);
  return db.select().from(journalLinks).where(inArray(journalLinks.entryId, entryIds));
}

export async function insertLink(
  db: Database,
  values: {
    entryId: string;
    taskId: string | null;
    projectId: string | null;
    milestoneId: string | null;
    decisionId: string | null;
    plannerBlockId: string | null;
  },
): Promise<JournalLinkRow> {
  const [row] = await db.insert(journalLinks).values(values).returning();
  if (!row) throw new Error("Failed to insert journal link");
  return row;
}

// --- reflections ---
export function listReflections(db: Database, limit = 90): Promise<DailyReflectionRow[]> {
  return db.select().from(dailyReflections).orderBy(desc(dailyReflections.date)).limit(limit);
}

export async function getReflection(
  db: Database,
  date: string,
): Promise<DailyReflectionRow | undefined> {
  const [row] = await db
    .select()
    .from(dailyReflections)
    .where(eq(dailyReflections.date, date))
    .limit(1);
  return row;
}

export async function upsertReflection(
  db: Database,
  date: string,
  patch: {
    reflection: string;
    wins: string[];
    lessons: string[];
    gratitude: string[];
    tomorrowFocus: string;
    completedAt: Date | null;
  },
): Promise<DailyReflectionRow> {
  const [row] = await db
    .insert(dailyReflections)
    .values({ date, ...patch })
    .onConflictDoUpdate({ target: dailyReflections.date, set: patch })
    .returning();
  if (!row) throw new Error("Failed to upsert reflection");
  return row;
}

// --- reviews ---
export function listReviews(db: Database, limit = 60): Promise<JournalReviewRow[]> {
  return db.select().from(journalReviews).orderBy(desc(journalReviews.createdAt)).limit(limit);
}

export async function insertReview(
  db: Database,
  values: { period: JournalReviewRow["period"]; summary: string },
): Promise<JournalReviewRow> {
  const [row] = await db.insert(journalReviews).values(values).returning();
  if (!row) throw new Error("Failed to insert review");
  return row;
}

/** Entries created within [from, to) — used by reviews + history. */
export function entriesBetween(db: Database, from: Date, to: Date): Promise<JournalEntryRow[]> {
  return db
    .select()
    .from(journalEntries)
    .where(and(gte(journalEntries.createdAt, from), lte(journalEntries.createdAt, to)))
    .orderBy(desc(journalEntries.createdAt));
}
