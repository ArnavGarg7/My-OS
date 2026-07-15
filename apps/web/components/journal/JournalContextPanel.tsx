"use client";

import { Sparkles } from "lucide-react";
import { Text } from "@myos/ui";
import { writingStats } from "@myos/core/journal";
import { useJournal } from "./use-journal";
import { JournalViewer } from "./JournalViewer";
import { MOOD_LABEL } from "./journal-icons";

/**
 * Journal context panel (Sprint 2.10). Shows the selected entry (viewer + mood +
 * writing stats + links) or, with nothing selected, today's streak + counts.
 */
export function JournalContextPanel() {
  const journal = useJournal();
  const entry = journal.selected;
  const summary = journal.summary;

  if (entry) {
    const stats = writingStats(entry.content);
    return (
      <div className="flex flex-col gap-4 p-4">
        <JournalViewer
          entry={entry}
          onArchive={() => journal.archive(entry.id)}
          onDelete={() => journal.remove(entry.id)}
        />
        <div className="border-border flex flex-col gap-1 border-t pt-3">
          {entry.mood && (
            <Text variant="caption" tone="subtle">
              Mood: {MOOD_LABEL[entry.mood]}
            </Text>
          )}
          <Text variant="caption" tone="subtle">
            {stats.words} words · {entry.links.length} linked
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Sparkles size={14} aria-hidden className="text-accent" />
        <Text variant="heading-s">Journal</Text>
      </span>
      {summary ? (
        <div className="flex flex-col gap-1">
          <Text variant="body-s">
            {summary.streak.current}-day streak · longest {summary.streak.longest}
          </Text>
          <Text variant="caption" tone="subtle">
            {summary.counts.entries} entries · {summary.counts.reflections} reflections ·{" "}
            {summary.counts.gratitude} gratitude
          </Text>
          {summary.outstandingLesson && (
            <Text variant="caption" tone="subtle">
              Lesson: {summary.outstandingLesson}
            </Text>
          )}
        </div>
      ) : (
        <Text variant="body-s" tone="subtle">
          Select an entry to see its details, mood and links.
        </Text>
      )}
    </div>
  );
}
