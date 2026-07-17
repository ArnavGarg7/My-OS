import "server-only";
import {
  dailyReview,
  resurface,
  type DailyReview,
  type ResurfacedItem,
} from "@myos/core/knowledge";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Review + resurfacing (Sprint 4.1). Loads flashcards / knowledge and defers to the pure
 * deterministic schedulers — daily flashcard selection and morning memory resurfacing.
 */
export async function daily(db: Database): Promise<DailyReview> {
  const cards = await repo.listCards(db);
  return dailyReview(cards, new Date());
}

export async function resurfacing(db: Database, limit = 6): Promise<ResurfacedItem[]> {
  const [notes, wiki, booksList, research] = await Promise.all([
    repo.listNotes(db),
    repo.listWiki(db),
    repo.listBooks(db),
    repo.listResearch(db),
  ]);
  return resurface({ notes, wiki, books: booksList, research, now: new Date() }, limit);
}
