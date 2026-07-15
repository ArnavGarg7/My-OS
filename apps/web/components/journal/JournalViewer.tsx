"use client";

import { Archive, Trash2 } from "lucide-react";
import { Badge, Button, Text } from "@myos/ui";
import { writingStats, type JournalEntry } from "@myos/core/journal";
import { ENTRY_ICON, ENTRY_LABEL, MOOD_EMOJI } from "./journal-icons";

/**
 * JournalViewer (Sprint 2.10). Read view of a single entry — title, meta, mood,
 * tags, content + archive/delete actions.
 */
export function JournalViewer({
  entry,
  onArchive,
  onDelete,
}: {
  entry: JournalEntry;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const Icon = ENTRY_ICON[entry.entryType];
  const stats = writingStats(entry.content);
  return (
    <article className="flex flex-col gap-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Text variant="heading-m">{entry.title || "Untitled entry"}</Text>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <Badge size="sm" variant="neutral">
              <Icon size={12} aria-hidden />
              {ENTRY_LABEL[entry.entryType]}
            </Badge>
            {entry.mood && <span aria-label={entry.mood}>{MOOD_EMOJI[entry.mood]}</span>}
            <Text variant="caption" tone="subtle">
              {new Date(entry.createdAt).toLocaleString()}
            </Text>
          </span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onArchive} aria-label="Archive entry">
            <Archive size={14} aria-hidden />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Delete entry">
            <Trash2 size={14} aria-hidden />
          </Button>
        </div>
      </header>

      <Text variant="body-m" className="whitespace-pre-wrap">
        {entry.content || "No content."}
      </Text>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <Badge key={t} size="sm" variant="neutral">
              #{t}
            </Badge>
          ))}
        </div>
      )}

      <Text variant="caption" tone="subtle" className="tabular-nums">
        {stats.words} words · {stats.readingMinutes} min read
      </Text>
    </article>
  );
}
