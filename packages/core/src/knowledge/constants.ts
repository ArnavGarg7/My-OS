/**
 * Knowledge & Memory Platform constants (Sprint 4.1). The deterministic second brain:
 * permanent notes, a wiki with backlinks, a knowledge graph, reading/course/research
 * learning trackers, rule-based spaced-repetition flashcards and memory resurfacing.
 * Extends — never replaces — the Journal Engine (2.10). No AI, no randomness, no
 * embeddings; Phase 5's AI layer will consume this platform without changing it.
 */

/** The kinds of first-class knowledge entities (graph node types). */
export const KNOWLEDGE_TYPES = [
  "note",
  "wiki",
  "book",
  "course",
  "research",
  "flashcard_deck",
] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

/** Learning progress lifecycle shared by books/courses/research. */
export const LEARNING_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "on_hold",
  "abandoned",
] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

/** Deterministic spaced-repetition states (no ML). */
export const FLASHCARD_STATES = ["new", "learning", "review", "mastered"] as const;
export type FlashcardState = (typeof FLASHCARD_STATES)[number];

/** The fixed spaced-repetition interval ladder (days). Rule-based, never learned. */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 120] as const;
export type ReviewInterval = (typeof REVIEW_INTERVALS)[number];

/** Book reading lifecycle. */
export const BOOK_STATUSES = [
  "want_to_read",
  "reading",
  "finished",
  "abandoned",
  "reference",
] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/** Course lifecycle. */
export const COURSE_STATUSES = [
  "enrolled",
  "in_progress",
  "completed",
  "paused",
  "dropped",
] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

/** Directed edge kinds in the knowledge graph. */
export const LINK_KINDS = [
  "references",
  "mentions",
  "related",
  "prerequisite",
  "derived_from",
  "belongs_to",
] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

/** Flashcard review grades (deterministic scheduler input). */
export const REVIEW_GRADES = ["again", "hard", "good", "easy"] as const;
export type ReviewGrade = (typeof REVIEW_GRADES)[number];

/** Ranking bands for deterministic knowledge search (higher wins). */
export const SEARCH_WEIGHTS = {
  exactTitle: 1000,
  wikiTitle: 800,
  heading: 600,
  tag: 500,
  body: 300,
  reference: 200,
  recent: 100,
} as const;

/** Resurfacing reason kinds, each with a fixed weight (deterministic ranking). */
export const RESURFACE_REASONS = [
  "interesting_note",
  "stale_research",
  "unopened_book",
  "important_wiki",
  "forgotten_knowledge",
  "recently_linked",
] as const;
export type ResurfaceReason = (typeof RESURFACE_REASONS)[number];

export const RESURFACE_WEIGHTS: Record<ResurfaceReason, number> = {
  forgotten_knowledge: 60,
  stale_research: 55,
  important_wiki: 50,
  unopened_book: 45,
  recently_linked: 40,
  interesting_note: 35,
};

/** A note/wiki page is an "orphan" when it has no incoming or outgoing links. */
export const STALE_RESEARCH_DAYS = 14;
export const UNOPENED_BOOK_DAYS = 21;
export const FORGOTTEN_NOTE_DAYS = 45;
export const RECENTLY_LINKED_DAYS = 7;

/** How many flashcards a single daily review session surfaces at most. */
export const DAILY_REVIEW_LIMIT = 40;

/** Consistency multiplier applied when a mastered card is graded `again` (demote). */
export const MASTERY_REVIEWS_REQUIRED = 3;
