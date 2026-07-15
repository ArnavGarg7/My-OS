"use client";

import { Award, Flame, TrendingUp } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { relativeTime } from "@/components/timeline/timeline-icons";

/**
 * Morning Briefing timeline slot (Sprint 2.13). Editorial, read-only: yesterday's
 * highlights, recent achievements and current streaks — pulled from the unified
 * history so nothing is recomputed. The Timeline owns the aggregation.
 */
export function MorningTimelineSection() {
  const highlights = trpc.timeline.highlights.useQuery({});
  const memories = trpc.timeline.memories.useQuery();

  const hl = highlights.data ?? [];
  const streak = hl.find((h) => h.category === "largest_journal_streak");
  const topHighlights = hl.filter((h) => h.category !== "largest_journal_streak").slice(0, 2);
  const recentMemories = (memories.data ?? []).slice(0, 2);

  if (hl.length === 0 && recentMemories.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Your history is just getting started — highlights appear here as you work.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {topHighlights.map((h) => (
        <div key={h.category} className="flex items-start gap-2">
          <TrendingUp size={15} aria-hidden className="text-success mt-0.5 shrink-0" />
          <Text variant="body-s">{h.title}</Text>
        </div>
      ))}

      {streak && (
        <div className="flex items-center gap-2">
          <Flame size={15} aria-hidden className="text-warning" />
          <Text variant="body-s">{streak.title}</Text>
        </div>
      )}

      {recentMemories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5">
            <Award size={14} aria-hidden className="text-fg-subtle" />
            <Text variant="caption" tone="subtle">
              Recent achievements
            </Text>
          </span>
          {recentMemories.map((m) => (
            <Text key={m.id} variant="body-s" tone="subtle">
              {m.title} · {relativeTime(m.at)}
            </Text>
          ))}
        </div>
      )}
    </div>
  );
}
