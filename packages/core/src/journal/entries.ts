import type { EntryType, LinkTarget, MoodLevel } from "./constants";
import type { JournalEntry, JournalLink } from "./types";

/**
 * Entry lifecycle (Sprint 2.10). Pure create / update / archive / link helpers.
 * No persistence — the service assigns ids + timestamps at the boundary.
 */
export interface CreateEntryInput {
  title: string;
  content: string;
  entryType?: EntryType;
  mood?: MoodLevel | null;
  tags?: string[];
  links?: JournalLink[];
}

export function createEntry(input: CreateEntryInput, now: Date): JournalEntry {
  const iso = now.toISOString();
  return {
    id: "",
    title: input.title.trim(),
    content: input.content,
    entryType: input.entryType ?? "daily",
    mood: input.mood ?? null,
    tags: normalizeTags(input.tags ?? []),
    archived: false,
    links: input.links ?? [],
    createdAt: iso,
    updatedAt: iso,
  };
}

export interface UpdateEntryPatch {
  title?: string;
  content?: string;
  entryType?: EntryType;
  mood?: MoodLevel | null;
  tags?: string[];
}

export function updateEntry(entry: JournalEntry, patch: UpdateEntryPatch, now: Date): JournalEntry {
  return {
    ...entry,
    ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
    ...(patch.content !== undefined ? { content: patch.content } : {}),
    ...(patch.entryType !== undefined ? { entryType: patch.entryType } : {}),
    ...(patch.mood !== undefined ? { mood: patch.mood } : {}),
    ...(patch.tags !== undefined ? { tags: normalizeTags(patch.tags) } : {}),
    updatedAt: now.toISOString(),
  };
}

export function archiveEntry(entry: JournalEntry, now: Date): JournalEntry {
  return { ...entry, archived: true, updatedAt: now.toISOString() };
}

/** Add a link (idempotent — no duplicates). */
export function addLink(entry: JournalEntry, target: LinkTarget, targetId: string): JournalEntry {
  if (entry.links.some((l) => l.target === target && l.targetId === targetId)) return entry;
  return { ...entry, links: [...entry.links, { target, targetId }] };
}

export function removeLink(
  entry: JournalEntry,
  target: LinkTarget,
  targetId: string,
): JournalEntry {
  return {
    ...entry,
    links: entry.links.filter((l) => !(l.target === target && l.targetId === targetId)),
  };
}

export function validateEntry(entry: JournalEntry): string[] {
  const errors: string[] = [];
  if (!entry.title.trim() && !entry.content.trim())
    errors.push("An entry needs a title or content.");
  if (entry.title.length > 300) errors.push("Title is too long.");
  return errors;
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase().replace(/^#/, "");
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out;
}
