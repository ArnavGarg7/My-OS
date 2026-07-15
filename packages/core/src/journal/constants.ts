/**
 * Journal domain constants (Sprint 2.10). The deterministic reflection engine —
 * entries, daily reflections, gratitude, reviews and mood. The canonical home
 * for personal writing and lived experience (Inbox owns transient capture).
 * No AI, no randomness.
 */

export const ENTRY_TYPES = ["daily", "reflection", "gratitude", "review", "idea"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const MOOD_LEVELS = ["very_low", "low", "neutral", "good", "excellent"] as const;
export type MoodLevel = (typeof MOOD_LEVELS)[number];

/** Numeric score for mood math (trends, averages). */
export const MOOD_SCORE: Record<MoodLevel, number> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  excellent: 5,
};

export const REVIEW_PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;
export type ReviewPeriod = (typeof REVIEW_PERIODS)[number];

/** What a journal entry may link to (no data duplication — ids only). */
export const LINK_TARGETS = ["task", "project", "milestone", "decision", "planner_block"] as const;
export type LinkTarget = (typeof LINK_TARGETS)[number];

/** Time-of-day / lifecycle buckets that drive rule-based prompts. */
export const PROMPT_CONTEXTS = ["morning", "evening", "weekly", "monthly", "any"] as const;
export type PromptContext = (typeof PROMPT_CONTEXTS)[number];

/** Search rank weights: a title hit beats a body hit; exact phrase beats terms. */
export const SEARCH_WEIGHTS = {
  titleExact: 100,
  titleTerm: 40,
  phrase: 30,
  bodyTerm: 10,
  linked: 5,
} as const;

/** A "writing streak" needs an entry/reflection on consecutive days. */
export const STREAK_LOOKBACK_DAYS = 60;

/** Rolling window (days) for mood trend + averages. */
export const MOOD_WINDOW_DAYS = 7;

/** Average adult reading speed (words per minute) for reading-time estimates. */
export const WORDS_PER_MINUTE = 200;
