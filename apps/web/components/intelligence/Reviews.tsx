"use client";

import { Badge, Button, Text } from "@myos/ui";
import { REVIEW_PERIODS, type ReviewPeriod, type ReviewSnapshot } from "@myos/core/intelligence";

/**
 * Reviews (Sprint 4.4). Generate an immutable period review and browse past snapshots. A
 * review records what the numbers were on its date — history, never recomputed.
 */
export function Reviews({
  reviews,
  onGenerate,
}: {
  reviews: ReviewSnapshot[];
  onGenerate: (period: ReviewPeriod) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="caption" tone="subtle">
          GENERATE A REVIEW
        </Text>
        {REVIEW_PERIODS.map((p) => (
          <Button key={p} size="sm" variant="secondary" onClick={() => onGenerate(p)}>
            {p}
          </Button>
        ))}
      </div>
      {reviews.length === 0 ? (
        <Text variant="caption" tone="subtle">
          No reviews yet — generate your first above.
        </Text>
      ) : (
        <div className="flex flex-col gap-1">
          {reviews.map((r) => (
            <div
              key={`${r.period}-${r.periodStart}-${r.createdAt}`}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex flex-col">
                <Text variant="body-s">
                  {r.period} · {r.periodStart}
                </Text>
                <Text variant="caption" tone="subtle">
                  {r.highlights[0] ?? ""}
                </Text>
              </span>
              <Badge size="sm" variant="neutral">
                {r.overall}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
