import { JOURNAL_TARGETS } from "./constants";
import { clampScore, countKind } from "./metrics";
import type { JournalAnalyticsInput } from "./types";
import type { TimelineEvent } from "../timeline";

/**
 * Journal analytics (Sprint 2.14). Writing consistency + mood trend from the
 * Journal engine's summary, entry cadence from the Timeline. Produces a 0–100
 * journaling score. Deterministic.
 */
export interface JournalMetrics {
  writingStreak: number;
  wordCount: number;
  entries: number;
  reflectionConsistency: number; // 0–100
  moodTrend: number; // 1–5
  gratitudeCount: number;
  score: number; // 0–100
}

export function computeJournal(
  events: TimelineEvent[],
  spanDays: number,
  input?: JournalAnalyticsInput,
): JournalMetrics {
  const j = input ?? {
    writingStreak: 0,
    wordCount: 0,
    reflectionCount: 0,
    moodTrend: 3,
    gratitudeCount: 0,
  };
  const entries = countKind(events, "journal.created");
  const weeks = Math.max(1, spanDays / 7);
  const entriesPerWeek = entries / weeks;

  const cadenceScore = clampScore((entriesPerWeek / JOURNAL_TARGETS.entriesPerWeek) * 100);
  const reflectionConsistency = clampScore(
    (j.reflectionCount / Math.max(1, JOURNAL_TARGETS.entriesPerWeek * weeks)) * 100,
  );
  const moodScore = clampScore((j.moodTrend / 5) * 100);

  const score = clampScore(cadenceScore * 0.4 + reflectionConsistency * 0.35 + moodScore * 0.25);

  return {
    writingStreak: j.writingStreak,
    wordCount: j.wordCount,
    entries,
    reflectionConsistency,
    moodTrend: Math.round(j.moodTrend * 10) / 10,
    gratitudeCount: j.gratitudeCount,
    score,
  };
}
