import { journalEngine } from "./engine";
import type { DailyReflection, JournalEntry, JournalReview } from "./types";

/** Test fixtures for the journal engine (imported by *.test.ts). */
export const at = (y: number, mo: number, d: number, h = 9) =>
  new Date(Date.UTC(y, mo, d, h, 0, 0)).toISOString();

export function makeEntry(over: Partial<JournalEntry> = {}): JournalEntry {
  const base = journalEngine.create(
    { title: over.title ?? "A day", content: over.content ?? "Today I wrote." },
    new Date(over.createdAt ?? at(2026, 6, 7)),
  );
  return {
    ...base,
    ...over,
    id: over.id ?? "e1",
    tags: over.tags ?? [],
    links: over.links ?? [],
    createdAt: over.createdAt ?? at(2026, 6, 7),
    updatedAt: over.updatedAt ?? over.createdAt ?? at(2026, 6, 7),
  };
}

export function makeReflection(over: Partial<DailyReflection> = {}): DailyReflection {
  return {
    id: over.id ?? "r1",
    date: over.date ?? "2026-07-07",
    reflection: over.reflection ?? "A solid day.",
    wins: over.wins ?? ["Shipped the feature"],
    lessons: over.lessons ?? ["Start earlier"],
    gratitude: over.gratitude ?? ["Good coffee"],
    tomorrowFocus: over.tomorrowFocus ?? "Deep work",
    completedAt: over.completedAt ?? null,
    createdAt: over.createdAt ?? at(2026, 6, 7, 21),
  };
}

export function makeReview(over: Partial<JournalReview> = {}): JournalReview {
  return {
    id: over.id ?? "rv1",
    period: over.period ?? "weekly",
    summary: over.summary ?? "A productive week.",
    createdAt: over.createdAt ?? at(2026, 6, 7, 20),
  };
}
