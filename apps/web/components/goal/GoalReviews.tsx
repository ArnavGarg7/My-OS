"use client";

import { ClipboardCheck } from "lucide-react";
import { Button, Text } from "@myos/ui";
import type { GoalReview, ReviewPeriod } from "@myos/core/goal";

/**
 * GoalReviews (Sprint 2.12). Lists a goal's period reviews with their progress
 * snapshot + quick actions to create a new review. Journal remains canonical.
 */
export function GoalReviews({
  reviews,
  onCreate,
}: {
  reviews: GoalReview[];
  onCreate?: (period: ReviewPeriod) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {onCreate && (
        <div className="flex flex-wrap gap-1.5">
          {(["weekly", "monthly", "quarterly"] as ReviewPeriod[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant="secondary"
              onClick={() => onCreate(p)}
              className="capitalize"
            >
              {p} review
            </Button>
          ))}
        </div>
      )}
      {reviews.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          No reviews yet.
        </Text>
      ) : (
        <ul className="flex flex-col gap-2">
          {reviews.map((r) => (
            <li key={r.id} className="border-border flex items-start gap-2 rounded-md border p-2">
              <ClipboardCheck size={14} aria-hidden className="text-fg-subtle mt-0.5" />
              <div className="min-w-0">
                <Text variant="body-s">{r.summary}</Text>
                <Text variant="caption" tone="subtle" className="capitalize">
                  {r.reviewPeriod} · {r.progressSnapshot}% ·{" "}
                  {new Date(r.reviewedAt).toLocaleDateString()}
                </Text>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
