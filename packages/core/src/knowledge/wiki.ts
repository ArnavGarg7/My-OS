import type { Note, WikiPage } from "./types";

/**
 * Wiki system (Sprint 4.1). Every page is uniquely identified by its title (Obsidian
 * style). Normalization + slugging is the single source of truth for link resolution,
 * so `[[Machine Learning]]`, `[[machine learning]]` and `[[Machine  Learning]]` all
 * resolve to the same page. Pure + deterministic.
 */

/** Case/space-insensitive identity key for a title. */
export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** URL-safe stable slug. */
export function slugify(title: string): string {
  return normalizeTitle(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A page holder that can be resolved by title. */
export interface WikiEntry {
  id: string;
  title: string;
  linkedTitles: string[];
}

/** Resolve which linked titles already exist as pages/notes vs. are unresolved. */
export function resolveLinks(
  linkedTitles: string[],
  existing: { title: string }[],
): { resolved: string[]; unresolved: string[] } {
  const known = new Set(existing.map((e) => normalizeTitle(e.title)));
  const resolved: string[] = [];
  const unresolved: string[] = [];
  for (const t of dedupeTitles(linkedTitles)) {
    (known.has(normalizeTitle(t)) ? resolved : unresolved).push(t);
  }
  return { resolved, unresolved };
}

/** Titles that are linked TO but have no page yet — the wiki's "red links". */
export function orphanTargets(entries: WikiEntry[]): string[] {
  const known = new Set(entries.map((e) => normalizeTitle(e.title)));
  const missing = new Set<string>();
  for (const e of entries) {
    for (const t of e.linkedTitles) {
      if (!known.has(normalizeTitle(t))) missing.add(normalizeTitle(t));
    }
  }
  return [...missing].sort();
}

/** Pages with no incoming AND no outgoing links. */
export function orphanPages(entries: WikiEntry[]): WikiEntry[] {
  const incoming = new Set<string>();
  for (const e of entries) {
    for (const t of e.linkedTitles) incoming.add(normalizeTitle(t));
  }
  return entries.filter(
    (e) => e.linkedTitles.length === 0 && !incoming.has(normalizeTitle(e.title)),
  );
}

function dedupeTitles(titles: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of titles) {
    const k = normalizeTitle(t);
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

/** Build a title→entity lookup across notes + wiki pages (wiki wins on collision). */
export function titleIndex(notes: Note[], wiki: WikiPage[]): Map<string, Note | WikiPage> {
  const index = new Map<string, Note | WikiPage>();
  for (const n of notes) index.set(normalizeTitle(n.title), n);
  for (const w of wiki) index.set(normalizeTitle(w.title), w); // wiki overrides
  return index;
}
