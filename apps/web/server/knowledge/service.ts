import "server-only";
import { randomUUID } from "node:crypto";
import { createKnowledgeEngine } from "@myos/core/knowledge";
import type {
  Book,
  Course,
  Flashcard,
  KnowledgeType,
  LinkKind,
  Note,
  ResearchProject,
  ReviewGrade,
  WikiPage,
} from "@myos/core/knowledge";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * KnowledgeService (Sprint 4.1). Bridges the pure KnowledgeEngine with persistence. The
 * engine parses wiki links + tags and drives flashcard reviews deterministically; the
 * service persists the results and logs review history. No feature logic lives here
 * beyond composition — every derivation happens in core.
 */
const engine = createKnowledgeEngine(() => randomUUID());

/* ── Notes ─────────────────────────────────────────────────────────────── */
export async function createNote(
  db: Database,
  input: { title?: string; content?: string; tags?: string[]; pinned?: boolean },
): Promise<Note> {
  return repo.insertNote(db, engine.makeNote(input));
}

export async function updateNote(
  db: Database,
  id: string,
  patch: Partial<Note>,
): Promise<Note | null> {
  const existing = await repo.getNote(db, id);
  if (!existing) return null;
  return repo.updateNoteRow(db, id, engine.reparseNote(existing, patch));
}

export function deleteNote(db: Database, id: string): Promise<void> {
  return repo.deleteNote(db, id);
}

export function listNotes(db: Database): Promise<Note[]> {
  return repo.listNotes(db);
}
export function getNote(db: Database, id: string): Promise<Note | null> {
  return repo.getNote(db, id);
}

/* ── Wiki ──────────────────────────────────────────────────────────────── */
export async function createWiki(
  db: Database,
  input: { title: string; content?: string; tags?: string[] },
): Promise<WikiPage> {
  return repo.insertWiki(db, engine.makeWiki(input));
}
export async function updateWiki(
  db: Database,
  id: string,
  patch: Partial<WikiPage>,
): Promise<WikiPage | null> {
  const existing = await repo.getWiki(db, id);
  if (!existing) return null;
  return repo.updateWikiRow(db, id, engine.reparseWiki(existing, patch));
}
export function listWiki(db: Database): Promise<WikiPage[]> {
  return repo.listWiki(db);
}

/* ── Books / Courses / Research ────────────────────────────────────────── */
export function listBooks(db: Database): Promise<Book[]> {
  return repo.listBooks(db);
}
export function createBook(db: Database, v: Partial<Book> & { title: string }): Promise<Book> {
  return repo.insertBook(db, v);
}
export function updateBook(db: Database, id: string, v: Partial<Book>): Promise<Book> {
  return repo.updateBookRow(db, id, v);
}

export function listCourses(db: Database): Promise<Course[]> {
  return repo.listCourses(db);
}
export function createCourse(
  db: Database,
  v: Partial<Course> & { title: string },
): Promise<Course> {
  return repo.insertCourse(db, v);
}
export function updateCourse(db: Database, id: string, v: Partial<Course>): Promise<Course> {
  return repo.updateCourseRow(db, id, v);
}

export function listResearch(db: Database): Promise<ResearchProject[]> {
  return repo.listResearch(db);
}
export function createResearch(
  db: Database,
  v: Partial<ResearchProject> & { title: string },
): Promise<ResearchProject> {
  return repo.insertResearch(db, v);
}
export function updateResearch(
  db: Database,
  id: string,
  v: Partial<ResearchProject>,
): Promise<ResearchProject> {
  return repo.updateResearchRow(db, id, v);
}

/* ── Flashcards ────────────────────────────────────────────────────────── */
export function listDecks(db: Database) {
  return repo.listDecks(db);
}
export function createDeck(
  db: Database,
  v: { title: string; description?: string; tags?: string[] },
) {
  return repo.insertDeck(db, v);
}
export function listCards(db: Database): Promise<Flashcard[]> {
  return repo.listCards(db);
}
export function createCard(
  db: Database,
  v: { deckId: string; front: string; back: string },
): Promise<Flashcard> {
  return repo.insertCard(db, engine.makeCard(v.deckId, v.front, v.back));
}

/** Apply a review grade: update the card via the pure scheduler + log history. */
export async function reviewCard(
  db: Database,
  id: string,
  grade: ReviewGrade,
): Promise<Flashcard | null> {
  const card = await repo.getCard(db, id);
  if (!card) return null;
  const { card: next, fromState, toState } = engine.review(card, grade);
  const saved = await repo.updateCardRow(db, next);
  await repo.insertReview(db, { cardId: id, grade, fromState, toState });
  return saved;
}

/* ── Links ─────────────────────────────────────────────────────────────── */
export function listLinks(db: Database) {
  return repo.listLinks(db);
}
export function createLink(
  db: Database,
  link: {
    sourceId: string;
    sourceType: KnowledgeType;
    targetId: string;
    targetType: KnowledgeType;
    kind: LinkKind;
  },
) {
  return repo.insertLink(db, link);
}

export function listReviews(db: Database) {
  return repo.listReviews(db);
}
