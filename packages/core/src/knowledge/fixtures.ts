import type {
  Book,
  Course,
  Flashcard,
  KnowledgeLink,
  MemoryReview,
  Note,
  ResearchProject,
  WikiPage,
} from "./types";
import { parseWikiLinks } from "./parser";
import { slugify } from "./wiki";

/**
 * Deterministic knowledge fixtures (Sprint 4.1). Fixed ids + timestamps so the graph,
 * search, resurfacing and stats are reproducible in tests.
 */
export const FIXED_NOW = new Date("2026-07-15T12:00:00.000Z");

let counter = 0;
export function makeCounterId(prefix = "k"): () => string {
  return () => `${prefix}-${(counter += 1)}`;
}
export function resetCounter(): void {
  counter = 0;
}

export function makeNote(over: Partial<Note> = {}): Note {
  const content = over.content ?? "# Machine Learning\nSee [[Linear Algebra]] and #ai basics.";
  return {
    id: "note-1",
    title: "Machine Learning",
    content,
    tags: ["ai"],
    linkedTitles: parseWikiLinks(content),
    archived: false,
    pinned: false,
    createdAt: "2026-07-10T09:00:00.000Z",
    updatedAt: "2026-07-14T09:00:00.000Z",
    ...over,
  };
}

export function makeWiki(over: Partial<WikiPage> = {}): WikiPage {
  const title = over.title ?? "Linear Algebra";
  const content = over.content ?? "Foundational for [[Machine Learning]].";
  return {
    id: "wiki-1",
    title,
    slug: slugify(title),
    content,
    tags: ["math"],
    linkedTitles: parseWikiLinks(content),
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-12T09:00:00.000Z",
    ...over,
  };
}

export function makeBook(over: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "Deep Learning",
    author: "Goodfellow",
    status: "reading",
    totalPages: 800,
    currentPage: 200,
    rating: null,
    notes: "Chapter 6 on backprop.",
    highlights: [],
    minutesRead: 600,
    startedAt: "2026-06-15T09:00:00.000Z",
    finishedAt: null,
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-07-13T09:00:00.000Z",
    ...over,
  };
}

export function makeCourse(over: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    title: "CS229",
    provider: "Stanford",
    status: "in_progress",
    totalModules: 20,
    completedModules: 12,
    hoursSpent: 40,
    certificate: false,
    notes: "",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-13T09:00:00.000Z",
    ...over,
  };
}

export function makeResearch(over: Partial<ResearchProject> = {}): ResearchProject {
  return {
    id: "research-1",
    title: "RAG Architecture",
    question: "How to ground LLM answers?",
    hypothesis: "Retrieval improves factuality.",
    status: "in_progress",
    sources: ["Lewis et al. 2020"],
    experiments: [],
    conclusions: "",
    relatedNoteIds: ["note-1"],
    createdAt: "2026-06-20T09:00:00.000Z",
    updatedAt: "2026-07-14T09:00:00.000Z",
    ...over,
  };
}

export function makeDeckCard(over: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "card-1",
    deckId: "deck-1",
    front: "What is gradient descent?",
    back: "An optimization algorithm.",
    state: "review",
    intervalStep: 2,
    streak: 1,
    dueAt: "2026-07-14T09:00:00.000Z",
    lastReviewedAt: "2026-07-07T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-07T09:00:00.000Z",
    ...over,
  };
}

export function makeReview(over: Partial<MemoryReview> = {}): MemoryReview {
  return {
    id: "mr-1",
    cardId: "card-1",
    grade: "good",
    fromState: "review",
    toState: "review",
    reviewedAt: "2026-07-15T09:00:00.000Z",
    ...over,
  };
}

export function makeLink(over: Partial<KnowledgeLink> = {}): KnowledgeLink {
  return {
    id: "link-1",
    sourceId: "note-1",
    sourceType: "note",
    targetId: "wiki-1",
    targetType: "wiki",
    kind: "references",
    createdAt: "2026-07-10T09:00:00.000Z",
    ...over,
  };
}
