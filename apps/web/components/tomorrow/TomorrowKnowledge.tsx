"use client";

import { Brain } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Tomorrow Studio learning planning (Sprint 4.1). A closing prompt to plan tomorrow's
 * learning — continue reading, review flashcards, advance a research goal. Read-only
 * derived from the knowledge summary.
 */
export function TomorrowKnowledge() {
  const summary = trpc.knowledge.summary.useQuery();
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="border-border-subtle flex flex-col gap-2 rounded-md border px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <Brain size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s">Learning for tomorrow</Text>
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {s.activeBook ? (
          <Badge size="sm" variant="neutral">
            Continue reading: {s.activeBook}
          </Badge>
        ) : null}
        {s.dueFlashcards > 0 ? (
          <Badge size="sm" variant="accent">
            Review {s.dueFlashcards} flashcards
          </Badge>
        ) : null}
        {s.activeResearch ? (
          <Badge size="sm" variant="neutral">
            Research: {s.activeResearch}
          </Badge>
        ) : null}
        {!s.activeBook && s.dueFlashcards === 0 && !s.activeResearch ? (
          <Text variant="caption" tone="subtle">
            No active learning — add a book, deck or research to plan tomorrow.
          </Text>
        ) : null}
      </div>
    </div>
  );
}
