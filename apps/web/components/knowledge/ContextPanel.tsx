"use client";

import { Brain } from "lucide-react";
import { Badge, StatBlock, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Knowledge context panel (Sprint 4.1). Route-aware snapshot on /knowledge — portfolio
 * totals, due flashcards, active book/research and the graph size. Read-only.
 */
export function KnowledgeContextPanel() {
  const summary = trpc.knowledge.summary.useQuery();
  const portfolio = trpc.knowledge.portfolio.useQuery();
  const s = summary.data;
  const p = portfolio.data;

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Brain size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Knowledge</Text>
      </span>

      {p ? (
        <div className="grid grid-cols-2 gap-2">
          <StatBlock label="Notes" value={String(p.totalNotes)} />
          <StatBlock label="Wiki" value={String(p.wikiPages)} />
          <StatBlock label="Graph" value={String(p.graphSize)} />
          <StatBlock label="Avg links" value={String(p.averageConnections)} />
        </div>
      ) : null}

      {s ? (
        <div className="flex flex-wrap items-center gap-2">
          {s.dueFlashcards > 0 ? (
            <Badge size="sm" variant="accent">
              {s.dueFlashcards} due
            </Badge>
          ) : null}
          {s.activeBook ? (
            <Badge size="sm" variant="neutral">
              Reading: {s.activeBook}
            </Badge>
          ) : null}
          {s.activeResearch ? (
            <Badge size="sm" variant="neutral">
              Research: {s.activeResearch}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {p?.mostConnectedTopic ? (
        <Text variant="caption" tone="subtle">
          Most connected: {p.mostConnectedTopic}
        </Text>
      ) : null}
    </div>
  );
}
