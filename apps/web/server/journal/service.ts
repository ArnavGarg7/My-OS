import "server-only";
import {
  createEntry,
  createReflection,
  journalEngine,
  summarizeReview,
  updateEntry as engineUpdateEntry,
  archiveEntry as engineArchiveEntry,
  type CreateEntrySchemaInput,
  type DailyReflection,
  type JournalEntry,
  type JournalLink,
  type JournalReview,
  type LinkTarget,
  type ReviewPeriod,
  type UpdateEntrySchemaInput,
} from "@myos/core/journal";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import {
  entryRowToEntry,
  linkRowToLinks,
  linkToColumns,
  reflectionRowToReflection,
  reviewRowToReview,
} from "./mapper";

/**
 * JournalService (Sprint 2.10). Bridges the pure JournalEngine with persistence.
 * Entries + daily reflections + reviews; links point at existing entities
 * (no duplication). Derived summaries/counts are always recomputed on read.
 */
async function hydrateEntries(db: Database, includeArchived = false): Promise<JournalEntry[]> {
  const rows = await repo.listEntries(db, includeArchived);
  const linkRows = await repo.linksForEntries(
    db,
    rows.map((r) => r.id),
  );
  const byEntry = new Map<string, JournalLink[]>();
  for (const l of linkRows) {
    byEntry.set(l.entryId, [...(byEntry.get(l.entryId) ?? []), ...linkRowToLinks(l)]);
  }
  return rows.map((r) => entryRowToEntry(r, byEntry.get(r.id) ?? []));
}

export async function list(db: Database, includeArchived = false): Promise<JournalEntry[]> {
  return hydrateEntries(db, includeArchived);
}

export async function get(db: Database, id: string): Promise<JournalEntry> {
  const row = await repo.getEntry(db, id);
  if (!row) throw new Error("Entry not found");
  const links = (await repo.linksForEntries(db, [id])).flatMap(linkRowToLinks);
  return entryRowToEntry(row, links);
}

export async function create(db: Database, input: CreateEntrySchemaInput): Promise<JournalEntry> {
  const draft = createEntry(input, new Date());
  const errors = journalEngine.validate(draft);
  if (errors.length) throw new Error(errors.join(" "));
  const row = await repo.insertEntry(db, {
    title: draft.title,
    content: draft.content,
    entryType: draft.entryType,
    mood: draft.mood,
    tags: draft.tags,
    archived: false,
  });
  return entryRowToEntry(row);
}

export async function update(db: Database, input: UpdateEntrySchemaInput): Promise<JournalEntry> {
  const current = await get(db, input.id);
  const next = engineUpdateEntry(
    current,
    {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.entryType !== undefined ? { entryType: input.entryType } : {}),
      ...(input.mood !== undefined ? { mood: input.mood } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    },
    new Date(),
  );
  const row = await repo.updateEntry(db, input.id, {
    title: next.title,
    content: next.content,
    entryType: next.entryType,
    mood: next.mood,
    tags: next.tags,
    updatedAt: new Date(next.updatedAt),
  });
  return entryRowToEntry(row);
}

export async function remove(db: Database, id: string): Promise<{ id: string }> {
  await repo.deleteEntry(db, id);
  return { id };
}

export async function archive(db: Database, id: string): Promise<JournalEntry> {
  const current = await get(db, id);
  const next = engineArchiveEntry(current, new Date());
  const row = await repo.updateEntry(db, id, {
    archived: true,
    updatedAt: new Date(next.updatedAt),
  });
  return entryRowToEntry(row);
}

// --- links ---
export async function addLink(
  db: Database,
  input: { entryId: string; target: LinkTarget; targetId: string },
): Promise<{ ok: true }> {
  await repo.insertLink(db, {
    entryId: input.entryId,
    ...linkToColumns({ target: input.target, targetId: input.targetId }),
  });
  return { ok: true };
}

export async function links(db: Database, entryId: string): Promise<JournalLink[]> {
  return (await repo.linksForEntries(db, [entryId])).flatMap(linkRowToLinks);
}

// --- reflections ---
export async function listReflections(db: Database): Promise<DailyReflection[]> {
  return (await repo.listReflections(db)).map(reflectionRowToReflection);
}

export async function dailyReflection(
  db: Database,
  tz: string,
  input: {
    date?: string | undefined;
    reflection: string;
    wins: string[];
    lessons: string[];
    gratitude: string[];
    tomorrowFocus: string;
  },
): Promise<DailyReflection> {
  const date = input.date ?? todayInTimeZone(tz);
  const draft = createReflection({ ...input, date }, new Date());
  const complete =
    draft.reflection.trim().length > 0 && (draft.wins.length > 0 || draft.lessons.length > 0);
  const row = await repo.upsertReflection(db, date, {
    reflection: draft.reflection,
    wins: draft.wins,
    lessons: draft.lessons,
    gratitude: draft.gratitude,
    tomorrowFocus: draft.tomorrowFocus,
    completedAt: complete ? new Date() : null,
  });
  return reflectionRowToReflection(row);
}

// --- reviews ---
export async function createReview(
  db: Database,
  tz: string,
  input: { period: ReviewPeriod; summary?: string | undefined },
): Promise<JournalReview> {
  const summary =
    input.summary?.trim() ||
    summarizeReview(input.period, await listReflections(db), await hydrateEntries(db));
  const row = await repo.insertReview(db, { period: input.period, summary });
  return reviewRowToReview(row);
}

export async function listReviews(db: Database): Promise<JournalReview[]> {
  return (await repo.listReviews(db)).map(reviewRowToReview);
}
