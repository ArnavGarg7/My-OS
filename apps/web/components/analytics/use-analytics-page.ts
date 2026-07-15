"use client";

import { useState } from "react";
import type { ReportType } from "@myos/core/analytics";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/**
 * Analytics page controller (Sprint 2.14). Owns the active period + the selected
 * dashboard section, and fetches the headline summary/dashboard. Analytics is
 * read-only — no mutations except caching a generated report.
 */
export type AnalyticsSection =
  | "overview"
  | "productivity"
  | "focus"
  | "planner"
  | "calendar"
  | "projects"
  | "goals"
  | "health"
  | "finance"
  | "journal"
  | "timeline"
  | "review";

export function useAnalyticsPage() {
  const [period, setPeriod] = useState<ReportType>("weekly");
  const [section, setSection] = useState<AnalyticsSection>("overview");
  const selectedMetric = useShellStore((s) => s.selectedMetric);
  const setSelectedMetric = useShellStore((s) => s.setSelectedMetric);

  const summary = trpc.analytics.summary.useQuery({ type: period });
  const dashboard = trpc.analytics.dashboard.useQuery();

  return {
    period,
    setPeriod,
    section,
    setSection,
    summary: summary.data ?? null,
    dashboard: dashboard.data ?? null,
    isLoading: summary.isLoading,
    selectedMetric,
    selectMetric: (key: string | null) => setSelectedMetric(key),
  };
}
