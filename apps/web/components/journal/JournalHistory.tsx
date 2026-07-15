"use client";

import { BookOpen } from "lucide-react";
import { cn, EmptyState, Text } from "@myos/ui";
import type { JournalEntry } from "@myos/core/journal";
import { ENTRY_ICON, ENTRY_LABEL, MOOD_EMOJI } from "./journal-icons";

/**
 * JournalHistory (Sprint 2.10). The chronological list of entries; selecting one
 * opens it in the viewer / context panel.
 */
export function JournalHistory({
  entries,
  selectedId,
  onSelect,
}: {
  entries: JournalEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nothing written yet"
        description="Start your first entry — the journal is your record of lived experience."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {entries.map((entry) => {
        const Icon = ENTRY_ICON[entry.entryType];
        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry.id)}
              aria-pressed={entry.id === selectedId}
              className={cn(
                "border-border hover:border-accent/60 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                entry.id === selectedId && "border-accent ring-accent/30 ring-1",
              )}
            >
              <Icon size={16} aria-hidden className="text-fg-subtle mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <Text variant="body-s" className="truncate font-medium">
                  {entry.title || "Untitled entry"}
                </Text>
                <Text variant="caption" tone="subtle" className="truncate">
                  {ENTRY_LABEL[entry.entryType]} · {new Date(entry.createdAt).toLocaleDateString()}
                </Text>
              </div>
              {entry.mood && (
                <span aria-hidden className="shrink-0">
                  {MOOD_EMOJI[entry.mood]}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
