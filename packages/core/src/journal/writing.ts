import { WORDS_PER_MINUTE } from "./constants";
import type { JournalEntry, WritingStats } from "./types";

/**
 * Writing engine (Sprint 2.10). Pure text statistics — word count, character
 * count and reading time. Autosave/drafts are a client concern; the maths is here.
 */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function charCount(text: string): number {
  return text.length;
}

export function readingMinutes(text: string): number {
  return Math.max(text.trim() ? 1 : 0, Math.ceil(wordCount(text) / WORDS_PER_MINUTE));
}

export function writingStats(text: string): WritingStats {
  return {
    words: wordCount(text),
    characters: charCount(text),
    readingMinutes: readingMinutes(text),
  };
}

/** Total words written across a set of entries — feeds counts + analytics. */
export function totalWords(entries: JournalEntry[]): number {
  return entries.reduce((sum, e) => sum + wordCount(e.title) + wordCount(e.content), 0);
}
