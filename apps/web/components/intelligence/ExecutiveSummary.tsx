"use client";

import { Badge, StatBlock, Text } from "@myos/ui";
import type { ExecutiveSummary as Summary } from "@myos/core/intelligence";
import { ATTENTION_LABEL, ATTENTION_TONE, SummaryIcon } from "./intelligence-icons";

/**
 * ExecutiveSummary (Sprint 4.4). The structured (never prose) day snapshot. Every value is an
 * owned number arranged by the dashboard — nothing here is generated text.
 */
export function ExecutiveSummary({ summary }: { summary: Summary | undefined }) {
  if (!summary) return null;
  return (
    <div className="border-border-subtle flex flex-col gap-3 rounded-md border p-4">
      <span className="inline-flex items-center gap-2">
        <SummaryIcon size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Today&apos;s snapshot</Text>
        <Badge size="sm" variant={ATTENTION_TONE[summary.overallLevel]}>
          {ATTENTION_LABEL[summary.overallLevel]}
        </Badge>
      </span>

      <div className="flex flex-wrap gap-4">
        <StatBlock label="Overall" value={String(summary.overall)} />
        <StatBlock label="Health" value={String(summary.healthScore)} />
        <StatBlock label="Focus" value={summary.focusLabel} />
        <StatBlock label="Planner" value={`${summary.plannerAccuracy}%`} />
        <StatBlock label="Habits" value={`${summary.habitConsistency}%`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant="neutral">
          Learning: {summary.learning.coursesActive} courses · {summary.learning.flashcardsDue}{" "}
          cards due
        </Badge>
        <Badge size="sm" variant={summary.resources.upcomingRenewals > 0 ? "warning" : "neutral"}>
          Resources: {summary.resources.upcomingRenewals} renewals
        </Badge>
        <Badge size="sm" variant="neutral">
          Goals: {summary.goals.onTrack} on track · {summary.goals.slipping} slipping
        </Badge>
      </div>

      {summary.topAttention ? (
        <Text variant="caption" tone="subtle">
          Needs attention: {summary.topAttention}
        </Text>
      ) : (
        <Text variant="caption" tone="subtle">
          Nothing urgent — a clear day.
        </Text>
      )}
    </div>
  );
}
