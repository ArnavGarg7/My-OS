import {
  BookOpen,
  Brain,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  Network,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type {
  BookStatus,
  CourseStatus,
  FlashcardState,
  KnowledgeType,
  LearningStatus,
} from "@myos/core/knowledge";

/**
 * Knowledge icon + tone maps (Sprint 4.1). Pure presentation lookups shared by the
 * Knowledge Center — notes, wiki, reading, learning, flashcards, research and the graph.
 */
export const KnowledgeIcon = Brain;

export const TYPE_ICON: Record<KnowledgeType, LucideIcon> = {
  note: FileText,
  wiki: Network,
  book: BookOpen,
  course: GraduationCap,
  research: FlaskConical,
  flashcard_deck: Layers,
};

export const TYPE_LABEL: Record<KnowledgeType, string> = {
  note: "Note",
  wiki: "Wiki",
  book: "Book",
  course: "Course",
  research: "Research",
  flashcard_deck: "Deck",
};

export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  finished: "Finished",
  abandoned: "Abandoned",
  reference: "Reference",
};

export const BOOK_STATUS_BADGE: Record<BookStatus, "success" | "accent" | "neutral" | "warning"> = {
  want_to_read: "neutral",
  reading: "accent",
  finished: "success",
  abandoned: "warning",
  reference: "neutral",
};

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  enrolled: "Enrolled",
  in_progress: "In progress",
  completed: "Completed",
  paused: "Paused",
  dropped: "Dropped",
};

export const COURSE_STATUS_BADGE: Record<
  CourseStatus,
  "success" | "accent" | "neutral" | "warning"
> = {
  enrolled: "neutral",
  in_progress: "accent",
  completed: "success",
  paused: "warning",
  dropped: "warning",
};

export const LEARNING_STATUS_LABEL: Record<LearningStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
  abandoned: "Abandoned",
};

export const FLASHCARD_STATE_LABEL: Record<FlashcardState, string> = {
  new: "New",
  learning: "Learning",
  review: "Review",
  mastered: "Mastered",
};

export const FLASHCARD_STATE_BADGE: Record<
  FlashcardState,
  "success" | "accent" | "neutral" | "warning"
> = {
  new: "neutral",
  learning: "warning",
  review: "accent",
  mastered: "success",
};

export const GRADE_LABEL = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" } as const;

export { Sparkles };
