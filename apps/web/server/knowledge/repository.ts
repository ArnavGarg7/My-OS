import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  books,
  courses,
  flashcardDecks,
  flashcards,
  knowledgeLinks,
  knowledgeNotes,
  memoryReviews,
  researchProjects,
  wikiPages,
} from "@myos/db/schema";
import type {
  Book,
  Course,
  Flashcard,
  FlashcardDeck,
  KnowledgeLink,
  MemoryReview,
  Note,
  ResearchProject,
  WikiPage,
} from "@myos/core/knowledge";
import {
  bookRowToBook,
  cardRowToCard,
  courseRowToCourse,
  linkRowToLink,
  noteRowToNote,
  researchRowToResearch,
  reviewRowToReview,
  wikiRowToWiki,
} from "./mapper";

/**
 * Knowledge persistence (Sprint 4.1). CRUD over the nine knowledge tables. Every derived
 * view (graph/backlinks/portfolio/search/resurfacing) is computed by core from these
 * reads — nothing derived is stored.
 */

/* ── Notes ─────────────────────────────────────────────────────────────── */
export async function listNotes(db: Database): Promise<Note[]> {
  const rows = await db.select().from(knowledgeNotes).orderBy(desc(knowledgeNotes.updatedAt));
  return rows.map(noteRowToNote);
}
export async function getNote(db: Database, id: string): Promise<Note | null> {
  const [row] = await db.select().from(knowledgeNotes).where(eq(knowledgeNotes.id, id)).limit(1);
  return row ? noteRowToNote(row) : null;
}
export async function insertNote(db: Database, note: Note): Promise<Note> {
  const [row] = await db
    .insert(knowledgeNotes)
    .values({
      title: note.title,
      content: note.content,
      tags: note.tags,
      linkedTitles: note.linkedTitles,
      pinned: note.pinned,
    })
    .returning();
  return noteRowToNote(row!);
}
export async function updateNoteRow(db: Database, id: string, note: Note): Promise<Note> {
  const [row] = await db
    .update(knowledgeNotes)
    .set({
      title: note.title,
      content: note.content,
      tags: note.tags,
      linkedTitles: note.linkedTitles,
      pinned: note.pinned,
      archived: note.archived,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeNotes.id, id))
    .returning();
  return noteRowToNote(row!);
}
export async function deleteNote(db: Database, id: string): Promise<void> {
  await db.delete(knowledgeNotes).where(eq(knowledgeNotes.id, id));
}

/* ── Wiki ──────────────────────────────────────────────────────────────── */
export async function listWiki(db: Database): Promise<WikiPage[]> {
  const rows = await db.select().from(wikiPages).orderBy(desc(wikiPages.updatedAt));
  return rows.map(wikiRowToWiki);
}
export async function getWiki(db: Database, id: string): Promise<WikiPage | null> {
  const [row] = await db.select().from(wikiPages).where(eq(wikiPages.id, id)).limit(1);
  return row ? wikiRowToWiki(row) : null;
}
export async function insertWiki(db: Database, page: WikiPage): Promise<WikiPage> {
  const [row] = await db
    .insert(wikiPages)
    .values({
      title: page.title,
      slug: page.slug,
      content: page.content,
      tags: page.tags,
      linkedTitles: page.linkedTitles,
    })
    .returning();
  return wikiRowToWiki(row!);
}
export async function updateWikiRow(db: Database, id: string, page: WikiPage): Promise<WikiPage> {
  const [row] = await db
    .update(wikiPages)
    .set({
      title: page.title,
      slug: page.slug,
      content: page.content,
      tags: page.tags,
      linkedTitles: page.linkedTitles,
      updatedAt: new Date(),
    })
    .where(eq(wikiPages.id, id))
    .returning();
  return wikiRowToWiki(row!);
}

/* ── Books ─────────────────────────────────────────────────────────────── */
export async function listBooks(db: Database): Promise<Book[]> {
  const rows = await db.select().from(books).orderBy(desc(books.updatedAt));
  return rows.map(bookRowToBook);
}
export async function insertBook(
  db: Database,
  v: Partial<Book> & { title: string },
): Promise<Book> {
  const [row] = await db
    .insert(books)
    .values({
      title: v.title,
      author: v.author ?? "",
      status: v.status ?? "want_to_read",
      totalPages: v.totalPages ?? 0,
      currentPage: v.currentPage ?? 0,
      rating: v.rating ?? null,
      notes: v.notes ?? "",
      minutesRead: v.minutesRead ?? 0,
      startedAt: v.status === "reading" ? new Date() : null,
    })
    .returning();
  return bookRowToBook(row!);
}
export async function updateBookRow(db: Database, id: string, v: Partial<Book>): Promise<Book> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of [
    "title",
    "author",
    "status",
    "totalPages",
    "currentPage",
    "rating",
    "notes",
    "minutesRead",
  ] as const) {
    if (v[k] !== undefined) patch[k === "totalPages" ? "totalPages" : k] = v[k];
  }
  if (v.status === "finished") patch.finishedAt = new Date();
  const [row] = await db.update(books).set(patch).where(eq(books.id, id)).returning();
  return bookRowToBook(row!);
}

/* ── Courses ───────────────────────────────────────────────────────────── */
export async function listCourses(db: Database): Promise<Course[]> {
  const rows = await db.select().from(courses).orderBy(desc(courses.updatedAt));
  return rows.map(courseRowToCourse);
}
export async function insertCourse(
  db: Database,
  v: Partial<Course> & { title: string },
): Promise<Course> {
  const [row] = await db
    .insert(courses)
    .values({
      title: v.title,
      provider: v.provider ?? "",
      status: v.status ?? "enrolled",
      totalModules: v.totalModules ?? 0,
      completedModules: v.completedModules ?? 0,
      hoursSpent: v.hoursSpent ?? 0,
      certificate: v.certificate ?? false,
      notes: v.notes ?? "",
    })
    .returning();
  return courseRowToCourse(row!);
}
export async function updateCourseRow(
  db: Database,
  id: string,
  v: Partial<Course>,
): Promise<Course> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of [
    "title",
    "provider",
    "status",
    "totalModules",
    "completedModules",
    "hoursSpent",
    "certificate",
    "notes",
  ] as const) {
    if (v[k] !== undefined) patch[k] = v[k];
  }
  const [row] = await db.update(courses).set(patch).where(eq(courses.id, id)).returning();
  return courseRowToCourse(row!);
}

/* ── Research ──────────────────────────────────────────────────────────── */
export async function listResearch(db: Database): Promise<ResearchProject[]> {
  const rows = await db.select().from(researchProjects).orderBy(desc(researchProjects.updatedAt));
  return rows.map(researchRowToResearch);
}
export async function insertResearch(
  db: Database,
  v: Partial<ResearchProject> & { title: string },
): Promise<ResearchProject> {
  const [row] = await db
    .insert(researchProjects)
    .values({
      title: v.title,
      question: v.question ?? "",
      hypothesis: v.hypothesis ?? "",
      status: v.status ?? "in_progress",
      sources: v.sources ?? [],
      experiments: v.experiments ?? [],
      conclusions: v.conclusions ?? "",
      relatedNoteIds: v.relatedNoteIds ?? [],
    })
    .returning();
  return researchRowToResearch(row!);
}
export async function updateResearchRow(
  db: Database,
  id: string,
  v: Partial<ResearchProject>,
): Promise<ResearchProject> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of [
    "title",
    "question",
    "hypothesis",
    "status",
    "sources",
    "experiments",
    "conclusions",
    "relatedNoteIds",
  ] as const) {
    if (v[k] !== undefined) patch[k] = v[k];
  }
  const [row] = await db
    .update(researchProjects)
    .set(patch)
    .where(eq(researchProjects.id, id))
    .returning();
  return researchRowToResearch(row!);
}

/* ── Decks + Flashcards ────────────────────────────────────────────────── */
export async function listDecks(db: Database): Promise<FlashcardDeck[]> {
  const rows = await db.select().from(flashcardDecks).orderBy(desc(flashcardDecks.updatedAt));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    tags: r.tags,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}
export async function insertDeck(
  db: Database,
  v: { title: string; description?: string; tags?: string[] },
): Promise<FlashcardDeck> {
  const [r] = await db
    .insert(flashcardDecks)
    .values({ title: v.title, description: v.description ?? "", tags: v.tags ?? [] })
    .returning();
  return {
    id: r!.id,
    title: r!.title,
    description: r!.description,
    tags: r!.tags,
    createdAt: r!.createdAt.toISOString(),
    updatedAt: r!.updatedAt.toISOString(),
  };
}
export async function listCards(db: Database): Promise<Flashcard[]> {
  const rows = await db.select().from(flashcards).orderBy(desc(flashcards.dueAt));
  return rows.map(cardRowToCard);
}
export async function getCard(db: Database, id: string): Promise<Flashcard | null> {
  const [row] = await db.select().from(flashcards).where(eq(flashcards.id, id)).limit(1);
  return row ? cardRowToCard(row) : null;
}
export async function insertCard(db: Database, card: Flashcard): Promise<Flashcard> {
  const [row] = await db
    .insert(flashcards)
    .values({
      deckId: card.deckId,
      front: card.front,
      back: card.back,
      state: card.state,
      intervalStep: card.intervalStep,
      streak: card.streak,
      dueAt: new Date(card.dueAt),
    })
    .returning();
  return cardRowToCard(row!);
}
export async function updateCardRow(db: Database, card: Flashcard): Promise<Flashcard> {
  const [row] = await db
    .update(flashcards)
    .set({
      state: card.state,
      intervalStep: card.intervalStep,
      streak: card.streak,
      dueAt: new Date(card.dueAt),
      lastReviewedAt: card.lastReviewedAt ? new Date(card.lastReviewedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(flashcards.id, card.id))
    .returning();
  return cardRowToCard(row!);
}

/* ── Reviews ───────────────────────────────────────────────────────────── */
export async function listReviews(db: Database, limit = 500): Promise<MemoryReview[]> {
  const rows = await db
    .select()
    .from(memoryReviews)
    .orderBy(desc(memoryReviews.reviewedAt))
    .limit(limit);
  return rows.map(reviewRowToReview);
}
export async function insertReview(
  db: Database,
  review: Omit<MemoryReview, "id" | "reviewedAt">,
): Promise<MemoryReview> {
  const [row] = await db
    .insert(memoryReviews)
    .values({
      cardId: review.cardId,
      grade: review.grade,
      fromState: review.fromState,
      toState: review.toState,
    })
    .returning();
  return reviewRowToReview(row!);
}

/* ── Links ─────────────────────────────────────────────────────────────── */
export async function listLinks(db: Database): Promise<KnowledgeLink[]> {
  const rows = await db.select().from(knowledgeLinks);
  return rows.map(linkRowToLink);
}
export async function insertLink(
  db: Database,
  link: Omit<KnowledgeLink, "id" | "createdAt">,
): Promise<KnowledgeLink> {
  const [row] = await db
    .insert(knowledgeLinks)
    .values({
      sourceId: link.sourceId,
      sourceType: link.sourceType,
      targetId: link.targetId,
      targetType: link.targetType,
      kind: link.kind,
    })
    .returning();
  return linkRowToLink(row!);
}
