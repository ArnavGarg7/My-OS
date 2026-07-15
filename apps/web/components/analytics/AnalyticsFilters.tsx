"use client";

import { REPORT_TYPES, type ReportType } from "@myos/core/analytics";
import { cn } from "@myos/ui";

const LABEL: Record<ReportType, string> = {
  daily: "Day",
  weekly: "Week",
  monthly: "Month",
  quarterly: "Quarter",
  yearly: "Year",
};

/** AnalyticsFilters (Sprint 2.14). Period selector for the dashboard. */
export function AnalyticsFilters({
  period,
  onPeriod,
}: {
  period: ReportType;
  onPeriod: (p: ReportType) => void;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Analytics period">
      {REPORT_TYPES.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={period === p}
          onClick={() => onPeriod(p)}
          className={cn(
            "text-caption rounded-full border px-2.5 py-1 transition-colors",
            period === p
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-fg-subtle hover:text-fg",
          )}
        >
          {LABEL[p]}
        </button>
      ))}
    </div>
  );
}
