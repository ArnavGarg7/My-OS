import type { HydrationSource, MealType, WorkoutType } from "./constants";

/**
 * Health quick-log parser (Sprint 2.9). Deterministic natural-language parsing
 * of short log phrases into a typed intent. No AI — regex + keyword tables.
 * "drank 500ml" → water; "ran 30 min" → workout; "slept 7h30" → sleep.
 */
export type ParsedLog =
  | { kind: "water"; amountMl: number; source: HydrationSource }
  | { kind: "workout"; type: WorkoutType; durationMinutes: number }
  | { kind: "sleep"; durationMinutes: number }
  | { kind: "meal"; meal: MealType; calories: number }
  | { kind: "weight"; weight: number }
  | { kind: "unknown"; text: string };

const WORKOUT_WORDS: Record<string, WorkoutType> = {
  run: "cardio",
  ran: "cardio",
  running: "cardio",
  jog: "cardio",
  cycle: "cardio",
  bike: "cardio",
  swim: "cardio",
  lift: "strength",
  lifted: "strength",
  gym: "strength",
  strength: "strength",
  weights: "strength",
  yoga: "mobility",
  stretch: "mobility",
  mobility: "mobility",
  walk: "walk",
  walked: "walk",
  sport: "sport",
  soccer: "sport",
  basketball: "sport",
  tennis: "sport",
};

const MEAL_WORDS: Record<string, MealType> = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snack: "snack",
};

/** Parse a duration expression like "30 min", "1h", "7h30", "90m" → minutes. */
export function parseDuration(text: string): number {
  const hm = text.match(/(\d+)\s*h(?:ours?)?\s*(\d+)?/i);
  if (hm) return parseInt(hm[1]!, 10) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0);
  const m = text.match(/(\d+)\s*m(?:in(?:utes?)?)?\b/i);
  if (m) return parseInt(m[1]!, 10);
  return 0;
}

/** Parse a volume like "500ml", "1.5l", "2 l" → millilitres. */
export function parseVolume(text: string): number {
  const l = text.match(/(\d+(?:\.\d+)?)\s*l\b/i);
  if (l) return Math.round(parseFloat(l[1]!) * 1000);
  const ml = text.match(/(\d+)\s*ml\b/i);
  if (ml) return parseInt(ml[1]!, 10);
  return 0;
}

export function parseLog(input: string): ParsedLog {
  const text = input.trim();
  const lower = text.toLowerCase();

  // Sleep.
  if (/\b(sleep|slept)\b/.test(lower)) {
    return { kind: "sleep", durationMinutes: parseDuration(lower) };
  }

  // Water / drink.
  if (/\b(water|drank|drink|hydrate)\b/.test(lower) || /\d+\s*(ml|l)\b/.test(lower)) {
    const source: HydrationSource = /coffee/.test(lower)
      ? "coffee"
      : /tea/.test(lower)
        ? "tea"
        : "water";
    return { kind: "water", amountMl: parseVolume(lower) || 250, source };
  }

  // Weight.
  const weightMatch = lower.match(/\b(?:weight|weigh(?:ed)?)\b.*?(\d+(?:\.\d+)?)\s*(?:kg)?/);
  if (weightMatch) return { kind: "weight", weight: parseFloat(weightMatch[1]!) };

  // Meal.
  for (const [word, meal] of Object.entries(MEAL_WORDS)) {
    if (lower.includes(word)) {
      const cal = lower.match(/(\d+)\s*(?:kcal|cal|calories)/);
      return { kind: "meal", meal, calories: cal ? parseInt(cal[1]!, 10) : 0 };
    }
  }

  // Workout.
  for (const [word, type] of Object.entries(WORKOUT_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      return { kind: "workout", type, durationMinutes: parseDuration(lower) || 30 };
    }
  }

  return { kind: "unknown", text };
}
