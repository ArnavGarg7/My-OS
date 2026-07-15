import { SEARCH_WEIGHTS, type EntryType, type MoodLevel } from "./constants";
import type { JournalEntry, SearchResult } from "./types";

/**
 * Journal selectors + search (Sprint 2.10). Deterministic keyword search
 * (exact title > title term > phrase > body term > linked) plus read filters.
 * No embeddings — semantic search is deferred to the AI phase.
 */
export interface JournalFilter {
  entryType?: EntryType | undefined;
  mood?: MoodLevel | undefined;
  tag?: string | undefined;
  includeArchived?: boolean | undefined;
}

export function filterEntries(entries: JournalEntry[], filter: JournalFilter): JournalEntry[] {
  return entries.filter((e) => {
    if (!filter.includeArchived && e.archived) return false;
    if (filter.entryType && e.entryType !== filter.entryType) return false;
    if (filter.mood && e.mood !== filter.mood) return false;
    if (filter.tag && !e.tags.includes(filter.tag.toLowerCase())) return false;
    return true;
  });
}

export function sortByRecent(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function entriesForDate(entries: JournalEntry[], date: string): JournalEntry[] {
  return entries.filter((e) => e.createdAt.slice(0, 10) === date);
}

/** Deterministic ranked search over title/body/tags/links. */
export function search(entries: JournalEntry[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];
  for (const entry of entries) {
    if (entry.archived) continue;
    const title = entry.title.toLowerCase();
    const body = entry.content.toLowerCase();
    let score = 0;
    const matchedIn = new Set<SearchResult["matchedIn"][number]>();

    if (title === q) {
      score += SEARCH_WEIGHTS.titleExact;
      matchedIn.add("title");
    }
    if (title.includes(q) && title !== q) {
      score += SEARCH_WEIGHTS.phrase;
      matchedIn.add("title");
    }
    if (body.includes(q)) {
      score += SEARCH_WEIGHTS.phrase;
      matchedIn.add("body");
    }
    for (const term of terms) {
      if (title.includes(term)) {
        score += SEARCH_WEIGHTS.titleTerm;
        matchedIn.add("title");
      }
      if (body.includes(term)) {
        score += SEARCH_WEIGHTS.bodyTerm;
        matchedIn.add("body");
      }
      if (entry.tags.some((t) => t.includes(term))) {
        score += SEARCH_WEIGHTS.titleTerm;
        matchedIn.add("tag");
      }
      if (entry.links.some((l) => l.targetId.toLowerCase().includes(term))) {
        score += SEARCH_WEIGHTS.linked;
        matchedIn.add("link");
      }
    }

    if (score > 0) results.push({ entry, score, matchedIn: [...matchedIn] });
  }

  return results.sort(
    (a, b) => b.score - a.score || b.entry.createdAt.localeCompare(a.entry.createdAt),
  );
}
