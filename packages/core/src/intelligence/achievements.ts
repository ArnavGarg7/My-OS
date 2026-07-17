import type { Achievement } from "./types";

/**
 * Achievement engine (Sprint 4.4). Deterministic badges crossed at explicit thresholds over
 * lifetime totals the owning modules already track. The rule table below is the whole
 * engine — there is no scoring, no discovery, no surprise. A total either cleared a
 * threshold or it did not.
 */

/** Lifetime totals the dashboard reads from each owner to test achievement thresholds. */
export interface AchievementInput {
  workoutsTotal: number;
  booksFinished: number;
  longestStreakDays: number;
  investmentsCount: number;
  goalsCompleted: number;
  reviewsCompleted: number;
  notesTotal: number;
  focusHoursTotal: number;
}

interface Rule {
  id: string;
  title: string;
  description: string;
  met: (i: AchievementInput) => boolean;
}

/** The explicit rule table. Every achievement in the platform is one row here. */
export const ACHIEVEMENT_RULES: Rule[] = [
  {
    id: "workouts-100",
    title: "Centurion",
    description: "Logged 100 workouts.",
    met: (i) => i.workoutsTotal >= 100,
  },
  {
    id: "books-50",
    title: "Bibliophile",
    description: "Finished 50 books.",
    met: (i) => i.booksFinished >= 50,
  },
  {
    id: "streak-365",
    title: "Year of Discipline",
    description: "Held a habit streak for 365 days.",
    met: (i) => i.longestStreakDays >= 365,
  },
  {
    id: "streak-30",
    title: "Month Strong",
    description: "Held a habit streak for 30 days.",
    met: (i) => i.longestStreakDays >= 30,
  },
  {
    id: "first-investment",
    title: "Investor",
    description: "Recorded your first investment.",
    met: (i) => i.investmentsCount >= 1,
  },
  {
    id: "goals-10",
    title: "Achiever",
    description: "Completed 10 goals.",
    met: (i) => i.goalsCompleted >= 10,
  },
  {
    id: "first-goal",
    title: "Finisher",
    description: "Completed your first goal.",
    met: (i) => i.goalsCompleted >= 1,
  },
  {
    id: "reviews-12",
    title: "Reflective",
    description: "Completed 12 reviews.",
    met: (i) => i.reviewsCompleted >= 12,
  },
  {
    id: "notes-100",
    title: "Second Brain",
    description: "Wrote 100 knowledge notes.",
    met: (i) => i.notesTotal >= 100,
  },
  {
    id: "focus-100h",
    title: "Deep Worker",
    description: "Logged 100 hours of deep work.",
    met: (i) => i.focusHoursTotal >= 100,
  },
];

/** Every achievement, with `unlockedAt` set (to `now`) only for those currently met. */
export function achievements(input: AchievementInput, now: Date): Achievement[] {
  const iso = now.toISOString();
  return ACHIEVEMENT_RULES.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    unlockedAt: r.met(input) ? iso : null,
  }));
}

export function unlockedAchievements(input: AchievementInput, now: Date): Achievement[] {
  return achievements(input, now).filter((a) => a.unlockedAt !== null);
}

export function unlockedCount(input: AchievementInput): number {
  return ACHIEVEMENT_RULES.filter((r) => r.met(input)).length;
}
