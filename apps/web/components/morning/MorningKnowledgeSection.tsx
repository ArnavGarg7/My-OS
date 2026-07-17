"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing knowledge slot (Sprint 4.1). A read-only glance at your second brain
 * for the day — what to continue reading, today's flashcard review count and any active
 * research. Links to the full Knowledge Center.
 */
export function MorningKnowledgeSection() {
  const summary = trpc.knowledge.summary.useQuery();
  const s = summary.data;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Brain size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {s
            ? `${s.totalNotes} note${s.totalNotes === 1 ? "" : "s"} in your second brain`
            : "No knowledge yet"}
        </Text>
      </div>
      {s ? (
        <div className="flex flex-wrap items-center gap-2">
          {s.dueFlashcards > 0 ? (
            <Badge size="sm" variant="accent">
              Today's review: {s.dueFlashcards} flashcards
            </Badge>
          ) : null}
          {s.activeBook ? (
            <Badge size="sm" variant="neutral">
              Continue: {s.activeBook}
            </Badge>
          ) : null}
          {s.activeResearch ? (
            <Badge size="sm" variant="neutral">
              Research: {s.activeResearch}
            </Badge>
          ) : null}
        </div>
      ) : null}
      <Link href="/knowledge" className="text-accent text-sm hover:underline">
        Open knowledge →
      </Link>
    </div>
  );
}
