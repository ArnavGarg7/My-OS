"use client";

import { Award, TrendingUp } from "lucide-react";
import { Text } from "@myos/ui";
import type { TimelineHighlight } from "@myos/core/timeline";
import { trpc } from "@/lib/trpc/client";

const CATEGORY_LABEL: Record<string, string> = {
  biggest_achievement: "Biggest achievement",
  longest_focus_block: "Longest focus block",
  most_productive_day: "Most productive day",
  biggest_spending_day: "Biggest spending day",
  best_workout: "Best workout",
  largest_journal_streak: "Largest journal streak",
};

/**
 * TimelineHighlights (Sprint 2.13). Deterministic "best of" over the history —
 * driven by `timeline.highlights`. Editorial, no cards.
 */
export function TimelineHighlights({ highlights }: { highlights?: TimelineHighlight[] }) {
  const query = trpc.timeline.highlights.useQuery({}, { enabled: highlights === undefined });
  const data = highlights ?? query.data ?? [];

  if (data.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Highlights appear as your history grows.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((h) => (
        <li key={h.category} className="flex items-start gap-2">
          <TrendingUp size={14} aria-hidden className="text-success mt-0.5 shrink-0" />
          <div className="min-w-0">
            <Text variant="body-s">{h.title}</Text>
            <Text variant="caption" tone="subtle">
              {CATEGORY_LABEL[h.category] ?? h.category} · {h.detail}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A compact header used in Morning + sidebar. */
export function HighlightsHeader() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Award size={14} aria-hidden className="text-fg-subtle" />
      <Text variant="label" tone="subtle">
        Highlights
      </Text>
    </span>
  );
}
