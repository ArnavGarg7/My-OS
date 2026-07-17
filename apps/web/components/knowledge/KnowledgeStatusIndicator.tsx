"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar knowledge indicator (Sprint 4.1): "Knowledge · 12 notes · 2 reviews".
 * Provider-driven via knowledge.summary.
 */
export function KnowledgeStatusIndicator() {
  const summary = trpc.knowledge.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className="bg-accent size-1.5 rounded-full" />
      <span className="text-fg-subtle">Knowledge</span>
      <span className="text-fg-muted font-medium">{s.totalNotes} notes</span>
      {s.dueFlashcards > 0 ? <span className="text-fg-muted">· {s.dueFlashcards} due</span> : null}
      {s.reviewsToday > 0 ? (
        <span className="text-fg-muted">· {s.reviewsToday} reviewed</span>
      ) : null}
    </div>
  );
}
