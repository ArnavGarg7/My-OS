"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { ATTENTION_LABEL, ATTENTION_TONE } from "@/components/intelligence/intelligence-icons";

/**
 * Morning Briefing executive summary slot (Sprint 4.4). The whole-life rollup at a glance —
 * overall score, focus, what's strongest/weakest and what needs attention. Read-only; every
 * value is composed by the Intelligence dashboard from the owning modules.
 */
export function MorningExecutiveSection() {
  const summary = trpc.intelligence.summary.useQuery();
  const s = summary.data;

  if (!s) {
    return (
      <Text variant="body-m" tone="subtle">
        No executive summary yet.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <LayoutDashboard size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          Life score {s.overall} · focus {s.focusLabel}
        </Text>
        <Badge size="sm" variant={ATTENTION_TONE[s.overallLevel]}>
          {ATTENTION_LABEL[s.overallLevel]}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant="success">
          Strongest: {s.strongest}
        </Badge>
        <Badge size="sm" variant={s.needsAttention > 0 ? "warning" : "neutral"}>
          Weakest: {s.weakest}
        </Badge>
        {s.needsAttention > 0 ? (
          <Badge size="sm" variant="danger">
            {s.needsAttention} need attention
          </Badge>
        ) : null}
        {s.reviewsDue > 0 ? (
          <Badge size="sm" variant="warning">
            {s.reviewsDue} review{s.reviewsDue === 1 ? "" : "s"} due
          </Badge>
        ) : null}
      </div>
      <Link href="/dashboard" className="text-accent text-sm hover:underline">
        Open dashboard →
      </Link>
    </div>
  );
}
