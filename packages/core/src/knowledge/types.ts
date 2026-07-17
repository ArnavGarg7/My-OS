import type {
  BookStatus,
  CourseStatus,
  FlashcardState,
  KnowledgeType,
  LearningStatus,
  LinkKind,
  ResurfaceReason,
} from "./constants";

/**
 * Knowledge platform types (Sprint 4.1). Pure domain shapes for notes, wiki pages, the
 * link graph, learning trackers, flashcards and memory resurfacing. Derived views
 * (portfolio, statistics, backlinks, graph) are computed, never stored.
 */

/** A permanent markdown note. */
export interface Note {
  id: string;
  title: string;
  content: string; // markdown
  tags: string[];
  /** Wiki-style [[targets]] parsed from content (resolved to titles, lowercased). */
  linkedTitles: string[];
  archived: boolean;
  pinned: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** A uniquely-identified wiki page (Obsidian-style). Title is the identity. */
export interface WikiPage {
  id: string;
  title: string;
  /** Normalized slug of the title — the stable wiki identity. */
  slug: string;
  content: string; // markdown
  tags: string[];
  linkedTitles: string[];
  createdAt: string;
  updatedAt: string;
}

/** A directed link between two knowledge entities. */
export interface KnowledgeLink {
  id: string;
  sourceId: string;
  sourceType: KnowledgeType;
  targetId: string;
  targetType: KnowledgeType;
  kind: LinkKind;
  createdAt: string;
}

/** A book being read/tracked. */
export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  totalPages: number;
  currentPage: number;
  rating: number | null; // 1..5
  notes: string;
  highlights: string[];
  minutesRead: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A course being tracked. */
export interface Course {
  id: string;
  title: string;
  provider: string;
  status: CourseStatus;
  totalModules: number;
  completedModules: number;
  hoursSpent: number;
  certificate: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** A long-running research investigation. */
export interface ResearchProject {
  id: string;
  title: string;
  question: string;
  hypothesis: string;
  status: LearningStatus;
  sources: string[];
  experiments: string[];
  conclusions: string;
  relatedNoteIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** A deck of flashcards. */
export interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** A single spaced-repetition flashcard. */
export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  state: FlashcardState;
  /** Index into REVIEW_INTERVALS for the current interval. */
  intervalStep: number;
  /** Consecutive `good`/`easy` reviews while in `review` state. */
  streak: number;
  dueAt: string; // ISO date the card is next due
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A logged flashcard review (append-only history). */
export interface MemoryReview {
  id: string;
  cardId: string;
  grade: string; // ReviewGrade
  fromState: FlashcardState;
  toState: FlashcardState;
  reviewedAt: string;
}

/* ── Derived views (computed, never stored) ───────────────────────────────── */

export interface Backlink {
  fromId: string;
  fromType: KnowledgeType;
  fromTitle: string;
}

export interface BacklinkView {
  /** Entities that link TO this one. */
  backlinks: Backlink[];
  /** Titles this entity links to that don't exist yet. */
  unresolved: string[];
  /** Whether this entity has no incoming and no outgoing links. */
  orphan: boolean;
}

export interface GraphNode {
  id: string;
  type: KnowledgeType;
  title: string;
  /** Deterministic layout coordinates (0..1), derived from a stable hash. */
  x: number;
  y: number;
  /** Number of edges touching this node. */
  degree: number;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  kind: LinkKind;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SearchHit {
  id: string;
  type: KnowledgeType;
  title: string;
  snippet: string;
  score: number;
  reason: string;
}

export interface ResurfacedItem {
  id: string;
  type: KnowledgeType;
  title: string;
  reason: ResurfaceReason;
  detail: string;
  score: number;
}

export interface KnowledgePortfolio {
  totalNotes: number;
  wikiPages: number;
  books: number;
  courses: number;
  flashcards: number;
  researchProjects: number;
  writingHours: number;
  learningHours: number;
  graphSize: number;
  averageConnections: number;
  mostConnectedTopic: string | null;
  readingVelocity: number; // pages/day over tracked books
}

export interface LearningStatistics {
  weeklyLearningHours: number;
  monthlyLearningHours: number;
  booksCompleted: number;
  coursesFinished: number;
  flashcardsReviewed: number;
  knowledgeGrowth: number; // net new entities in window
  topicsLearned: number;
  retention: number; // percent of due cards graded good/easy
  reviewCompletion: number; // percent of due cards actually reviewed
}

/** Deterministic signals surfaced to Decision / Morning / status bar. */
export interface KnowledgeSignals {
  flashcardsOverdue: number;
  bookStalled: boolean;
  courseDeadlineSoon: boolean;
  researchInactive: boolean;
  learningGoalFalling: boolean;
}

/** Compact summary for status bar / context panel / Morning / Tomorrow. */
export interface KnowledgeSummary {
  totalNotes: number;
  dueFlashcards: number;
  activeBook: string | null;
  activeResearch: string | null;
  reviewsToday: number;
}
