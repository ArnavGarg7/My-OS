import type {
  Book,
  Course,
  Flashcard,
  LearningStatistics,
  MemoryReview,
  Note,
  WikiPage,
} from "./types";
import { learningHours } from "./learning";
import { retention, reviewCompletion } from "./review";

/**
 * Learning statistics (Sprint 4.1). DERIVED metrics over a time window — learning hours,
 * completions, reviews, knowledge growth, retention. Never stored. Pure + deterministic.
 */

export interface StatisticsInput {
  notes: Note[];
  wiki: WikiPage[];
  books: Book[];
  courses: Course[];
  flashcards: Flashcard[];
  reviews: MemoryReview[];
  now: Date;
}

function withinDays(iso: string, now: Date, days: number): boolean {
  const age = (now.getTime() - new Date(iso).getTime()) / 86_400_000;
  return age >= 0 && age <= days;
}

export function buildStatistics(input: StatisticsInput): LearningStatistics {
  const { notes, wiki, books, courses, flashcards, reviews, now } = input;

  const booksCompleted = books.filter(
    (b) => b.status === "finished" && b.finishedAt && withinDays(b.finishedAt, now, 30),
  ).length;
  const coursesFinished = courses.filter(
    (c) => c.status === "completed" && withinDays(c.updatedAt, now, 30),
  ).length;

  const weekReviews = reviews.filter((r) => withinDays(r.reviewedAt, now, 7));
  const monthReviews = reviews.filter((r) => withinDays(r.reviewedAt, now, 30));

  // Knowledge growth: net new notes + wiki pages in the last 30 days.
  const knowledgeGrowth =
    notes.filter((n) => withinDays(n.createdAt, now, 30)).length +
    wiki.filter((w) => withinDays(w.createdAt, now, 30)).length;

  // Topics learned: distinct tags across notes + wiki.
  const topics = new Set<string>();
  for (const n of notes) for (const t of n.tags) topics.add(t);
  for (const w of wiki) for (const t of w.tags) topics.add(t);

  // Learning hours are a monthly-scale proxy; weekly is a quarter of it as a floor.
  const monthlyLearningHours = learningHours(books, courses);

  return {
    weeklyLearningHours: Number((monthlyLearningHours / 4).toFixed(1)),
    monthlyLearningHours,
    booksCompleted,
    coursesFinished,
    flashcardsReviewed: monthReviews.length,
    knowledgeGrowth,
    topicsLearned: topics.size,
    retention: retention(weekReviews),
    reviewCompletion: reviewCompletion(flashcards, reviews, now),
  };
}
