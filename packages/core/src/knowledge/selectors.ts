import { STALE_RESEARCH_DAYS } from "./constants";
import type {
  Book,
  Course,
  Flashcard,
  KnowledgeSignals,
  KnowledgeSummary,
  MemoryReview,
  Note,
  ResearchProject,
} from "./types";
import { activeBooks, activeResearch, courseProgress, isBookStalled } from "./learning";
import { overdueCount } from "./flashcards";
import { reviewsToday } from "./review";
import { activeNotes } from "./notes";

/**
 * Knowledge selectors (Sprint 4.1). Deterministic signals for the Decision engine and a
 * compact summary for status bar / Morning / Tomorrow / context panel. Pure.
 */

export interface SignalInput {
  notes: Note[];
  books: Book[];
  courses: Course[];
  research: ResearchProject[];
  flashcards: Flashcard[];
  now: Date;
}

function courseIdleAtRisk(course: Course, now: Date): boolean {
  if (course.status !== "in_progress") return false;
  const idle = (now.getTime() - new Date(course.updatedAt).getTime()) / 86_400_000;
  return idle >= 10 && courseProgress(course) >= 50 && courseProgress(course) < 100;
}

export function computeSignals(input: SignalInput): KnowledgeSignals {
  const { books, courses, research, flashcards, now } = input;
  const flashcardsOverdue = overdueCount(flashcards, now);
  const bookStalled = books.some((b) => isBookStalled(b, now));
  const courseDeadlineSoon = courses.some((c) => courseIdleAtRisk(c, now));
  const researchInactive = research.some((r) => {
    if (r.status !== "in_progress") return false;
    const idle = (now.getTime() - new Date(r.updatedAt).getTime()) / 86_400_000;
    return idle >= STALE_RESEARCH_DAYS;
  });

  const activeItems =
    activeBooks(books).length +
    activeResearch(research).length +
    courses.filter((c) => c.status === "in_progress").length;
  const learningGoalFalling = activeItems > 0 && flashcardsOverdue >= 20;

  return {
    flashcardsOverdue,
    bookStalled,
    courseDeadlineSoon,
    researchInactive,
    learningGoalFalling,
  };
}

export interface SummaryInput extends SignalInput {
  reviews: MemoryReview[];
}

export function buildSummary(input: SummaryInput): KnowledgeSummary {
  const { notes, books, research, flashcards, reviews, now } = input;
  const book = activeBooks(books)[0] ?? null;
  const activeR = activeResearch(research)[0] ?? null;
  return {
    totalNotes: activeNotes(notes).length,
    dueFlashcards: overdueCount(flashcards, now),
    activeBook: book?.title ?? null,
    activeResearch: activeR?.title ?? null,
    reviewsToday: reviewsToday(reviews, now),
  };
}
