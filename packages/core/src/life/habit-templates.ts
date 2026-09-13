import type { HabitFrequency } from "./constants";

/**
 * Seeded habit suggestions for the guided habit creator. Deterministic reference content (like the goal
 * templates / exercise catalog): a starting menu of common habits with a sensible default cadence, so an
 * empty Habits tab offers a one-tap start instead of a blank box. Everything stays editable — nothing
 * here is fabricated data, only a head start. Pure: no IO, no randomness.
 */
export interface HabitSuggestion {
  name: string;
  frequency: HabitFrequency;
}

export const HABIT_SUGGESTIONS: HabitSuggestion[] = [
  { name: "Drink 2L water", frequency: "daily" },
  { name: "Read 20 minutes", frequency: "daily" },
  { name: "Meditate", frequency: "daily" },
  { name: "Walk 10k steps", frequency: "daily" },
  { name: "Journal", frequency: "daily" },
  { name: "Sleep by 11 PM", frequency: "daily" },
  { name: "Stretch", frequency: "daily" },
  { name: "No junk food", frequency: "daily" },
  { name: "Exercise", frequency: "weekly" },
  { name: "Review goals", frequency: "weekly" },
  { name: "Meal prep", frequency: "weekly" },
  { name: "Budget review", frequency: "monthly" },
];
