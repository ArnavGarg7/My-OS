"use client";

import { StatBlock, Text } from "@myos/ui";
import type { DayReview as Review } from "@myos/core/tomorrow";
import { minutesLabel } from "./tomorrow-icons";

/** DayReview (Sprint 3.1). Step 1 — a deterministic summary of today's execution. */
export function DayReview({ review }: { review: Review }) {
  return (
    <div className="flex flex-col gap-4">
      <Text variant="body-m">{review.headline}</Text>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Completion" value={`${review.completionScore}%`} />
        <StatBlock label="Tasks done" value={String(review.tasksCompleted)} />
        <StatBlock label="Planner" value={`${review.plannerAccuracy}%`} />
        <StatBlock label="Deep work" value={minutesLabel(review.deepWorkMinutes)} />
        <StatBlock label="Decisions" value={String(review.decisionsAccepted)} />
        <StatBlock label="Goal progress" value={`${review.goalProgress}%`} />
        <StatBlock label="Readiness" value={`${review.healthReadiness}%`} />
        <StatBlock label="Journal" value={review.journalCompleted ? "Done" : "—"} />
      </div>
    </div>
  );
}
