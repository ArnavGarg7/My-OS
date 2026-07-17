import type { Note } from "./types";
import { headings, toPlainText } from "./markdown";

/**
 * Notes selectors (Sprint 4.1). Pure read helpers over permanent markdown notes.
 */

export function activeNotes(notes: Note[]): Note[] {
  return notes.filter((n) => !n.archived);
}

export function pinnedNotes(notes: Note[]): Note[] {
  return activeNotes(notes).filter((n) => n.pinned);
}

/** Notes sorted most-recently-updated first. */
export function recentNotes(notes: Note[], limit = 10): Note[] {
  return [...activeNotes(notes)]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

/** Notes carrying a given tag (case-insensitive). */
export function notesByTag(notes: Note[], tag: string): Note[] {
  const t = tag.toLowerCase();
  return activeNotes(notes).filter((n) => n.tags.includes(t));
}

/** All distinct tags across notes with their counts, sorted by frequency then name. */
export function tagCloud(notes: Note[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const n of activeNotes(notes)) {
    for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Approximate word count of a note's body (markdown stripped). */
export function wordCount(note: Note): number {
  const text = toPlainText(note.content);
  return text.length === 0 ? 0 : text.split(/\s+/).length;
}

/** Table of contents (headings) for a note. */
export function tableOfContents(note: Note): { level: number; text: string }[] {
  return headings(note.content);
}
