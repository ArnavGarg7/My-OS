import "server-only";
import { search as coreSearch, type SearchHit } from "@myos/core/knowledge";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Knowledge search (Sprint 4.1). Loads every searchable collection and defers to the
 * pure, deterministic core ranker. No vectors, no semantic search.
 */
export async function search(db: Database, query: string, limit = 20): Promise<SearchHit[]> {
  const [notes, wiki, booksList, coursesList, research] = await Promise.all([
    repo.listNotes(db),
    repo.listWiki(db),
    repo.listBooks(db),
    repo.listCourses(db),
    repo.listResearch(db),
  ]);
  return coreSearch(
    query,
    { notes, wiki, books: booksList, courses: coursesList, research },
    new Date(),
    limit,
  );
}
