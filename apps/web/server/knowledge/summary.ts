import "server-only";
import {
  buildPortfolio,
  buildStatistics,
  buildSummary,
  computeSignals,
  type KnowledgePortfolio,
  type KnowledgeSignals,
  type KnowledgeSummary,
  type LearningStatistics,
} from "@myos/core/knowledge";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Knowledge summary / portfolio / statistics / signals (Sprint 4.1). Loads the raw
 * collections and defers to the pure core derivations — nothing derived is stored.
 */
async function collections(db: Database) {
  const [notes, wiki, booksList, coursesList, research, cards, reviews, links] = await Promise.all([
    repo.listNotes(db),
    repo.listWiki(db),
    repo.listBooks(db),
    repo.listCourses(db),
    repo.listResearch(db),
    repo.listCards(db),
    repo.listReviews(db),
    repo.listLinks(db),
  ]);
  return { notes, wiki, booksList, coursesList, research, cards, reviews, links };
}

export async function summary(db: Database): Promise<KnowledgeSummary> {
  const c = await collections(db);
  return buildSummary({
    notes: c.notes,
    books: c.booksList,
    courses: c.coursesList,
    research: c.research,
    flashcards: c.cards,
    reviews: c.reviews,
    now: new Date(),
  });
}

export async function portfolio(db: Database): Promise<KnowledgePortfolio> {
  const c = await collections(db);
  return buildPortfolio({
    notes: c.notes,
    wiki: c.wiki,
    books: c.booksList,
    courses: c.coursesList,
    flashcards: c.cards,
    research: c.research,
    links: c.links,
    now: new Date(),
  });
}

export async function statistics(db: Database): Promise<LearningStatistics> {
  const c = await collections(db);
  return buildStatistics({
    notes: c.notes,
    wiki: c.wiki,
    books: c.booksList,
    courses: c.coursesList,
    flashcards: c.cards,
    reviews: c.reviews,
    now: new Date(),
  });
}

export async function signals(db: Database): Promise<KnowledgeSignals> {
  const c = await collections(db);
  return computeSignals({
    notes: c.notes,
    books: c.booksList,
    courses: c.coursesList,
    research: c.research,
    flashcards: c.cards,
    now: new Date(),
  });
}
