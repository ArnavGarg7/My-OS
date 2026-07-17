import type { Book, Course, ResearchProject } from "./types";

/**
 * Learning progress (Sprint 4.1). Pure derivations over the reading/course/research
 * trackers — progress percentages, active items, reading velocity. Never stored.
 */

export function bookProgress(book: Book): number {
  if (book.totalPages <= 0) return book.status === "finished" ? 100 : 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}

export function courseProgress(course: Course): number {
  if (course.totalModules <= 0) return course.status === "completed" ? 100 : 0;
  return Math.min(100, Math.round((course.completedModules / course.totalModules) * 100));
}

/** Books currently being read, most recently updated first. */
export function activeBooks(books: Book[]): Book[] {
  return books
    .filter((b) => b.status === "reading")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function activeCourses(courses: Course[]): Course[] {
  return courses
    .filter((c) => c.status === "in_progress")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function activeResearch(research: ResearchProject[]): ResearchProject[] {
  return research
    .filter((r) => r.status === "in_progress")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Reading velocity in pages/day across books that have both a start date and progress.
 * Deterministic average; 0 when nothing measurable.
 */
export function readingVelocity(books: Book[], now: Date): number {
  let pages = 0;
  let days = 0;
  for (const b of books) {
    if (!b.startedAt || b.currentPage <= 0) continue;
    const end = b.finishedAt ? new Date(b.finishedAt) : now;
    const elapsed = Math.max(1, (end.getTime() - new Date(b.startedAt).getTime()) / 86_400_000);
    pages += b.currentPage;
    days += elapsed;
  }
  return days > 0 ? Number((pages / days).toFixed(1)) : 0;
}

/** Total learning hours = course hours + reading minutes/60. */
export function learningHours(books: Book[], courses: Course[]): number {
  const readingHours = books.reduce((n, b) => n + b.minutesRead / 60, 0);
  const courseHours = courses.reduce((n, c) => n + c.hoursSpent, 0);
  return Number((readingHours + courseHours).toFixed(1));
}

/** Whether an active book has not advanced recently (stalled). */
export function isBookStalled(book: Book, now: Date, days = 10): boolean {
  if (book.status !== "reading") return false;
  const idle = (now.getTime() - new Date(book.updatedAt).getTime()) / 86_400_000;
  return idle >= days && bookProgress(book) < 100;
}
