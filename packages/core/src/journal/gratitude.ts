import type { DailyReflection } from "./types";

/**
 * Gratitude helpers (Sprint 2.10). Gratitude lives on the daily reflection; this
 * module aggregates it deterministically for the card + analytics.
 */
export function gratitudeForDate(reflections: DailyReflection[], date: string): string[] {
  return reflections.find((r) => r.date === date)?.gratitude ?? [];
}

export function allGratitude(reflections: DailyReflection[]): string[] {
  return reflections.flatMap((r) => r.gratitude);
}

export function gratitudeCount(reflections: DailyReflection[]): number {
  return allGratitude(reflections).length;
}

/** Days (in the window) that recorded at least one gratitude item. */
export function gratitudeDays(reflections: DailyReflection[]): number {
  return reflections.filter((r) => r.gratitude.length > 0).length;
}

export function addGratitude(reflection: DailyReflection, item: string): DailyReflection {
  const trimmed = item.trim();
  if (!trimmed || reflection.gratitude.includes(trimmed)) return reflection;
  return { ...reflection, gratitude: [...reflection.gratitude, trimmed] };
}
