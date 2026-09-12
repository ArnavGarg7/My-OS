import type { HydrationSource, WorkoutType } from "./constants";

/**
 * Seeded presets for the guided health quick-log. Deterministic reference content (like the
 * exercise / goal / nutrition catalogs): a tappable menu of common values so logging is one or two taps
 * instead of typing free text and hoping the parser understands it. Pure: no Date, no IO, no randomness.
 * Nothing here is fabricated measurement data — only sensible defaults the user picks from and can edit.
 */

/** Water/drink presets, grouped by source, with common serving sizes in millilitres. */
export interface HydrationPreset {
  source: HydrationSource;
  label: string;
  amounts: { label: string; ml: number }[];
}

export const HYDRATION_PRESETS: HydrationPreset[] = [
  {
    source: "water",
    label: "Water",
    amounts: [
      { label: "Glass · 250ml", ml: 250 },
      { label: "Bottle · 500ml", ml: 500 },
      { label: "Large · 750ml", ml: 750 },
    ],
  },
  {
    source: "coffee",
    label: "Coffee",
    amounts: [
      { label: "Cup · 150ml", ml: 150 },
      { label: "Mug · 250ml", ml: 250 },
    ],
  },
  {
    source: "tea",
    label: "Tea",
    amounts: [
      { label: "Cup · 150ml", ml: 150 },
      { label: "Mug · 250ml", ml: 250 },
    ],
  },
];

/** Workout types with a friendly label; the guided log pairs these with duration presets. */
export const WORKOUT_PRESETS: { type: WorkoutType; label: string }[] = [
  { type: "strength", label: "Strength" },
  { type: "cardio", label: "Cardio" },
  { type: "mobility", label: "Mobility" },
  { type: "sport", label: "Sport" },
  { type: "walk", label: "Walk" },
  { type: "other", label: "Other" },
];

/** Common workout durations in minutes. */
export const WORKOUT_DURATIONS_MIN = [15, 30, 45, 60] as const;

/** Common sleep durations in hours; the UI derives bed/wake from "now" minus this. */
export const SLEEP_DURATIONS_HOURS = [6, 7, 8, 9] as const;
