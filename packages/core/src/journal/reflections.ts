import type { DailyReflection } from "./types";

/**
 * Reflection engine (Sprint 2.10). Owns the structured daily reflection: the
 * reflection prose plus wins, lessons, gratitude and tomorrow's focus. Pure
 * create/update/complete + selectors over a reflection history.
 */
export interface ReflectionInput {
  date: string;
  reflection?: string;
  wins?: string[];
  lessons?: string[];
  gratitude?: string[];
  tomorrowFocus?: string;
}

export function createReflection(input: ReflectionInput, now: Date): DailyReflection {
  return {
    id: "",
    date: input.date,
    reflection: (input.reflection ?? "").trim(),
    wins: clean(input.wins),
    lessons: clean(input.lessons),
    gratitude: clean(input.gratitude),
    tomorrowFocus: (input.tomorrowFocus ?? "").trim(),
    completedAt: null,
    createdAt: now.toISOString(),
  };
}

export function completeReflection(reflection: DailyReflection, now: Date): DailyReflection {
  return { ...reflection, completedAt: now.toISOString() };
}

export function isComplete(reflection: DailyReflection): boolean {
  return (
    reflection.completedAt !== null ||
    (reflection.reflection.trim().length > 0 &&
      (reflection.wins.length > 0 || reflection.lessons.length > 0))
  );
}

/** The most recent reflection by date. */
export function latestReflection(reflections: DailyReflection[]): DailyReflection | null {
  if (reflections.length === 0) return null;
  return [...reflections].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!;
}

export function reflectionForDate(
  reflections: DailyReflection[],
  date: string,
): DailyReflection | null {
  return reflections.find((r) => r.date === date) ?? null;
}

/** The most recent unresolved lesson — surfaced by the Morning Briefing. */
export function outstandingLesson(reflections: DailyReflection[]): string | null {
  const withLessons = [...reflections]
    .filter((r) => r.lessons.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return withLessons.at(-1)?.lessons[0] ?? null;
}

export function allWins(reflections: DailyReflection[]): string[] {
  return reflections.flatMap((r) => r.wins);
}

function clean(items?: string[]): string[] {
  return (items ?? []).map((x) => x.trim()).filter(Boolean);
}
