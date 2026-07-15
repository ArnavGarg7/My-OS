"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Text } from "@myos/ui";
import type { Review } from "@myos/core/analytics";
import { trpc } from "@/lib/trpc/client";
import { PageLoading } from "@/components/framework";
import { ScoreTile } from "./AnalyticsCharts";

/**
 * ReviewView (Sprint 2.14). Deterministic editorial rendering of a period review
 * — scoreboard, headline metrics, highlights and rule-derived
 * achievements/bottlenecks/risks. Shared by every review period. No AI text.
 */
export function ReviewView({ review }: { review: Review }) {
  const s = review.scores;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Text variant="caption" tone="subtle">
          {review.periodStart} → {review.periodEnd}
        </Text>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ScoreTile label="Overall" score={s.overall} />
          <ScoreTile label="Productivity" score={s.productivity} />
          <ScoreTile label="Focus" score={s.focus} />
          <ScoreTile label="Health" score={s.health} />
        </div>
      </div>

      <div className="text-body-s grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        <Metric label="Tasks completed" value={review.productivity.tasksCompleted} />
        <Metric label="Deep work" value={`${review.focus.deepWorkMinutes}m`} />
        <Metric label="Longest focus" value={`${review.highlights.longestFocusMinutes}m`} />
        <Metric label="Most productive" value={review.highlights.mostProductiveDay?.date ?? "—"} />
        <Metric
          label="Largest expense"
          value={`₹${Math.round(review.highlights.largestExpense)}`}
        />
        <Metric label="Best habit" value={review.highlights.bestHabit ?? "—"} />
      </div>

      <ReviewList
        icon={CheckCircle2}
        tone="text-success"
        title="Achievements"
        items={review.achievements}
        empty="No achievements logged."
      />
      <ReviewList
        icon={AlertTriangle}
        tone="text-warning"
        title="Bottlenecks"
        items={review.bottlenecks}
        empty="No bottlenecks — clean run."
      />
      <ReviewList
        icon={ShieldAlert}
        tone="text-danger"
        title="Upcoming risks"
        items={review.upcomingRisks}
        empty="No risks flagged."
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-fg-subtle">{label}</span>
      <span className="text-fg-muted tabular-nums">{value}</span>
    </div>
  );
}

function ReviewList({
  icon: Icon,
  tone,
  title,
  items,
  empty,
}: {
  icon: typeof CheckCircle2;
  tone: string;
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="label" tone="subtle">
        {title}
      </Text>
      {items.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          {empty}
        </Text>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-2">
              <Icon size={14} aria-hidden className={`${tone} mt-0.5 shrink-0`} />
              <Text variant="body-s">{it}</Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** WeeklyReview (Sprint 2.14). This week's deterministic review. */
export function WeeklyReview() {
  const q = trpc.analytics.weeklyReview.useQuery();
  if (q.isLoading) return <PageLoading label="Assembling your week…" />;
  if (!q.data) return null;
  return <ReviewView review={q.data} />;
}
