import "server-only";
import {
  journalEngine,
  search as engineSearch,
  type JournalCounts,
  type JournalSignals,
  type JournalSummary,
  type SearchResult,
} from "@myos/core/journal";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { list, listReflections, listReviews } from "./service";

/**
 * Journal summary + search + signals (Sprint 2.10). Composes the pure engine
 * over hydrated data. Everything is derived at read time.
 */
async function gather(db: Database) {
  const [entries, reflections, reviews] = await Promise.all([
    list(db),
    listReflections(db),
    listReviews(db),
  ]);
  return { entries, reflections, reviews };
}

export async function summary(db: Database, tz: string, date?: string): Promise<JournalSummary> {
  const d = date ?? todayInTimeZone(tz);
  const { entries, reflections, reviews } = await gather(db);
  return journalEngine.summary({ date: d, entries, reflections, reviews });
}

export async function signals(db: Database, tz: string): Promise<JournalSignals> {
  const d = todayInTimeZone(tz);
  const { entries, reflections, reviews } = await gather(db);
  return journalEngine.signals({ date: d, entries, reflections, reviews });
}

export async function counts(db: Database, tz: string): Promise<JournalCounts> {
  const d = todayInTimeZone(tz);
  const { entries, reflections, reviews } = await gather(db);
  return journalEngine.counts({ date: d, entries, reflections, reviews });
}

export async function search(db: Database, query: string): Promise<SearchResult[]> {
  return engineSearch(await list(db), query);
}
