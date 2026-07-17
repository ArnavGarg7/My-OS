"use client";

import { Badge, Button, Text } from "@myos/ui";
import { REVIEW_PERIODS, type GeneratedReport, type ReviewPeriod } from "@myos/core/intelligence";

/**
 * Reports (Sprint 4.4). Generate a Markdown/JSON report from the latest snapshot and list
 * past reports. Reports are a formatting of read models — no new data.
 */
export function Reports({
  reports,
  onGenerate,
}: {
  reports: GeneratedReport[];
  onGenerate: (period: ReviewPeriod) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="caption" tone="subtle">
          GENERATE A REPORT
        </Text>
        {REVIEW_PERIODS.map((p) => (
          <Button key={p} size="sm" variant="secondary" onClick={() => onGenerate(p)}>
            {p}
          </Button>
        ))}
      </div>
      {reports.length === 0 ? (
        <Text variant="caption" tone="subtle">
          No reports yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-1">
          {reports.map((r) => (
            <div
              key={r.generatedAt}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <Text variant="body-s">{r.title}</Text>
              <Badge size="sm" variant="neutral">
                {r.format}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
