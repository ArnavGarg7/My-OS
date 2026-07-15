import {
  archiveEntry,
  createEntry,
  updateEntry,
  validateEntry,
  type CreateEntryInput,
  type UpdateEntryPatch,
} from "./entries";
import { latestReflection, outstandingLesson } from "./reflections";
import { gratitudeCount } from "./gratitude";
import { moodTrend, writingStreak } from "./mood";
import { totalWords } from "./writing";
import { entriesForDate } from "./selectors";
import type {
  DailyReflection,
  JournalCounts,
  JournalEntry,
  JournalReview,
  JournalSignals,
  JournalSummary,
} from "./types";

/**
 * JournalEngine (Sprint 2.10). Pure deterministic orchestration over the journal
 * sub-engines. Assembles the day's summary + cross-module signals from raw
 * entries / reflections / reviews. No React, DB, browser or randomness.
 */
export interface SummaryInput {
  date: string;
  entries: JournalEntry[];
  reflections: DailyReflection[];
  reviews: JournalReview[];
}

export class JournalEngine {
  create(input: CreateEntryInput, now: Date): JournalEntry {
    return createEntry(input, now);
  }

  update(entry: JournalEntry, patch: UpdateEntryPatch, now: Date): JournalEntry {
    return updateEntry(entry, patch, now);
  }

  archive(entry: JournalEntry, now: Date): JournalEntry {
    return archiveEntry(entry, now);
  }

  validate(entry: JournalEntry): string[] {
    return validateEntry(entry);
  }

  counts(input: SummaryInput): JournalCounts {
    return {
      entries: input.entries.filter((e) => !e.archived).length,
      reflections: input.reflections.length,
      gratitude: gratitudeCount(input.reflections),
      reviews: input.reviews.length,
      wordsWritten: totalWords(input.entries),
    };
  }

  summary(input: SummaryInput): JournalSummary {
    const active = input.entries.filter((e) => !e.archived);
    return {
      date: input.date,
      todaysEntries: entriesForDate(active, input.date).length,
      mood: moodTrend(active),
      streak: writingStreak(active, input.date),
      latestReflection: latestReflection(input.reflections),
      outstandingLesson: outstandingLesson(input.reflections),
      counts: this.counts(input),
    };
  }

  signals(input: SummaryInput): JournalSignals {
    const summary = this.summary(input);
    return {
      writingStreak: summary.streak.current,
      loggedToday: summary.todaysEntries > 0,
      moodAverage: summary.mood.average,
      latestReflection: summary.latestReflection?.reflection || null,
      outstandingLesson: summary.outstandingLesson,
    };
  }
}

export const journalEngine = new JournalEngine();
