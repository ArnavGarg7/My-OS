/**
 * Knowledge & Memory Platform schema (Sprint 4.1, Phase 4). The deterministic second
 * brain: permanent notes, an Obsidian-style wiki, a link graph, reading/course/research
 * learning trackers, spaced-repetition flashcards and a review log. Extends — never
 * replaces — the Journal Engine (2.10). Derived views (graph/portfolio/statistics/
 * backlinks/search) are NOT stored. Single user (05 §0: no user_id).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const knowledgeType = pgEnum("knowledge_type", [
  "note",
  "wiki",
  "book",
  "course",
  "research",
  "flashcard_deck",
]);

export const learningStatus = pgEnum("learning_status", [
  "not_started",
  "in_progress",
  "completed",
  "on_hold",
  "abandoned",
]);

export const flashcardState = pgEnum("flashcard_state", ["new", "learning", "review", "mastered"]);

export const reviewInterval = pgEnum("review_interval", [
  "d1",
  "d3",
  "d7",
  "d14",
  "d30",
  "d60",
  "d120",
]);

export const bookStatus = pgEnum("book_status", [
  "want_to_read",
  "reading",
  "finished",
  "abandoned",
  "reference",
]);

export const courseStatus = pgEnum("course_status", [
  "enrolled",
  "in_progress",
  "completed",
  "paused",
  "dropped",
]);

export const linkKind = pgEnum("knowledge_link_kind", [
  "references",
  "mentions",
  "related",
  "prerequisite",
  "derived_from",
  "belongs_to",
]);

export const knowledgeNotes = pgTable(
  "knowledge_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull().default("Untitled"),
    content: text("content").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    linkedTitles: jsonb("linked_titles").$type<string[]>().notNull().default([]),
    archived: boolean("archived").notNull().default(false),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUpdated: index("knowledge_notes_updated_idx").on(t.updatedAt),
  }),
);

export const wikiPages = pgTable(
  "wiki_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    linkedTitles: jsonb("linked_titles").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySlug: index("wiki_pages_slug_idx").on(t.slug),
  }),
);

export const knowledgeLinks = pgTable(
  "knowledge_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id").notNull(),
    sourceType: knowledgeType("source_type").notNull(),
    targetId: uuid("target_id").notNull(),
    targetType: knowledgeType("target_type").notNull(),
    kind: linkKind("kind").notNull().default("references"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySource: index("knowledge_links_source_idx").on(t.sourceId),
    byTarget: index("knowledge_links_target_idx").on(t.targetId),
  }),
);

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  status: bookStatus("status").notNull().default("want_to_read"),
  totalPages: integer("total_pages").notNull().default(0),
  currentPage: integer("current_page").notNull().default(0),
  rating: integer("rating"),
  notes: text("notes").notNull().default(""),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  minutesRead: integer("minutes_read").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  provider: text("provider").notNull().default(""),
  status: courseStatus("status").notNull().default("enrolled"),
  totalModules: integer("total_modules").notNull().default(0),
  completedModules: integer("completed_modules").notNull().default(0),
  hoursSpent: real("hours_spent").notNull().default(0),
  certificate: boolean("certificate").notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flashcardDecks = pgTable("flashcard_decks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flashcards = pgTable(
  "flashcards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    state: flashcardState("state").notNull().default("new"),
    intervalStep: integer("interval_step").notNull().default(0),
    streak: integer("streak").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byDeck: index("flashcards_deck_idx").on(t.deckId),
    byDue: index("flashcards_due_idx").on(t.dueAt),
  }),
);

export const researchProjects = pgTable("research_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  question: text("question").notNull().default(""),
  hypothesis: text("hypothesis").notNull().default(""),
  status: learningStatus("status").notNull().default("in_progress"),
  sources: jsonb("sources").$type<string[]>().notNull().default([]),
  experiments: jsonb("experiments").$type<string[]>().notNull().default([]),
  conclusions: text("conclusions").notNull().default(""),
  relatedNoteIds: jsonb("related_note_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memoryReviews = pgTable(
  "memory_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => flashcards.id, { onDelete: "cascade" }),
    grade: text("grade").notNull(),
    fromState: flashcardState("from_state").notNull(),
    toState: flashcardState("to_state").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byReviewedAt: index("memory_reviews_reviewed_idx").on(t.reviewedAt),
    byCard: index("memory_reviews_card_idx").on(t.cardId),
  }),
);

export type KnowledgeNoteRow = typeof knowledgeNotes.$inferSelect;
export type WikiPageRow = typeof wikiPages.$inferSelect;
export type KnowledgeLinkRow = typeof knowledgeLinks.$inferSelect;
export type BookRow = typeof books.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type FlashcardDeckRow = typeof flashcardDecks.$inferSelect;
export type FlashcardRow = typeof flashcards.$inferSelect;
export type ResearchProjectRow = typeof researchProjects.$inferSelect;
export type MemoryReviewRow = typeof memoryReviews.$inferSelect;
