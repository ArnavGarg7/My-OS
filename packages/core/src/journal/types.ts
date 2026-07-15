import type { EntryType, LinkTarget, MoodLevel, ReviewPeriod } from "./constants";

/**
 * Journal domain types (Sprint 2.10). Raw entities (entries, daily reflections,
 * reviews, links) + derived analytics (mood trends, streaks, writing stats,
 * search results). Derived values are always computed, never stored.
 */
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  entryType: EntryType;
  mood: MoodLevel | null;
  tags: string[];
  archived: boolean;
  links: JournalLink[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** One structured daily reflection: reflection + wins + lessons + gratitude. */
export interface DailyReflection {
  id: string;
  date: string; // YYYY-MM-DD
  reflection: string;
  wins: string[];
  lessons: string[];
  gratitude: string[];
  tomorrowFocus: string;
  completedAt: string | null; // ISO
  createdAt: string;
}

export interface JournalReview {
  id: string;
  period: ReviewPeriod;
  summary: string;
  createdAt: string;
}

export interface JournalLink {
  target: LinkTarget;
  targetId: string;
}

// --- derived analytics ---
export interface MoodTrend {
  average: number; // 1–5 (0 when no data)
  latest: MoodLevel | null;
  direction: "up" | "down" | "flat" | "unknown";
  distribution: Record<MoodLevel, number>;
  samples: number;
}

export interface JournalStreak {
  current: number; // consecutive days ending today (or yesterday)
  longest: number;
  lastEntryDate: string | null;
}

export interface WritingStats {
  words: number;
  characters: number;
  readingMinutes: number;
}

export interface SearchResult {
  entry: JournalEntry;
  score: number;
  matchedIn: ("title" | "body" | "tag" | "link")[];
}

export interface Prompt {
  id: string;
  context: string;
  text: string;
}

export interface JournalCounts {
  entries: number;
  reflections: number;
  gratitude: number;
  reviews: number;
  wordsWritten: number;
}

export interface JournalSummary {
  date: string;
  todaysEntries: number;
  mood: MoodTrend;
  streak: JournalStreak;
  latestReflection: DailyReflection | null;
  outstandingLesson: string | null;
  counts: JournalCounts;
}

/** Deterministic signals exposed to Morning / Today / Decision. */
export interface JournalSignals {
  writingStreak: number;
  loggedToday: boolean;
  moodAverage: number;
  latestReflection: string | null;
  outstandingLesson: string | null;
}
