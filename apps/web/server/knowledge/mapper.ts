import "server-only";
import type {
  BookRow,
  CourseRow,
  FlashcardRow,
  KnowledgeLinkRow,
  KnowledgeNoteRow,
  MemoryReviewRow,
  ResearchProjectRow,
  WikiPageRow,
} from "@myos/db/schema";
import type {
  Book,
  Course,
  Flashcard,
  FlashcardState,
  KnowledgeLink,
  KnowledgeType,
  LearningStatus,
  LinkKind,
  MemoryReview,
  Note,
  ResearchProject,
  WikiPage,
} from "@myos/core/knowledge";

/**
 * Knowledge mappers (Sprint 4.1). Convert persisted rows into the pure-domain shapes.
 * Derived views (graph/backlinks/portfolio/search) are computed in core, never stored.
 */
const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export function noteRowToNote(row: KnowledgeNoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags,
    linkedTitles: row.linkedTitles,
    archived: row.archived,
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function wikiRowToWiki(row: WikiPageRow): WikiPage {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    tags: row.tags,
    linkedTitles: row.linkedTitles,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function linkRowToLink(row: KnowledgeLinkRow): KnowledgeLink {
  return {
    id: row.id,
    sourceId: row.sourceId,
    sourceType: row.sourceType as KnowledgeType,
    targetId: row.targetId,
    targetType: row.targetType as KnowledgeType,
    kind: row.kind as LinkKind,
    createdAt: row.createdAt.toISOString(),
  };
}

export function bookRowToBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    status: row.status,
    totalPages: row.totalPages,
    currentPage: row.currentPage,
    rating: row.rating,
    notes: row.notes,
    highlights: row.highlights,
    minutesRead: row.minutesRead,
    startedAt: iso(row.startedAt),
    finishedAt: iso(row.finishedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function courseRowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    provider: row.provider,
    status: row.status,
    totalModules: row.totalModules,
    completedModules: row.completedModules,
    hoursSpent: row.hoursSpent,
    certificate: row.certificate,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function researchRowToResearch(row: ResearchProjectRow): ResearchProject {
  return {
    id: row.id,
    title: row.title,
    question: row.question,
    hypothesis: row.hypothesis,
    status: row.status as LearningStatus,
    sources: row.sources,
    experiments: row.experiments,
    conclusions: row.conclusions,
    relatedNoteIds: row.relatedNoteIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function cardRowToCard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    deckId: row.deckId,
    front: row.front,
    back: row.back,
    state: row.state as FlashcardState,
    intervalStep: row.intervalStep,
    streak: row.streak,
    dueAt: row.dueAt.toISOString(),
    lastReviewedAt: iso(row.lastReviewedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function reviewRowToReview(row: MemoryReviewRow): MemoryReview {
  return {
    id: row.id,
    cardId: row.cardId,
    grade: row.grade,
    fromState: row.fromState as FlashcardState,
    toState: row.toState as FlashcardState,
    reviewedAt: row.reviewedAt.toISOString(),
  };
}
