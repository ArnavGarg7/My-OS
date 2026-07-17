"use client";

import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";
import type { ReviewPeriod } from "@myos/core/intelligence";

/**
 * Intelligence Dashboard controller (Sprint 4.4). Owns every dashboard query + the config +
 * review/report mutations, and emits timeline + analytics events. It reads composed views —
 * it computes nothing itself. Deterministic; reflects the read models of the owning modules.
 */
export function useIntelligence() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  // Derived views — each recomputes server-side on fetch.
  const dashboard = trpc.intelligence.dashboard.useQuery(undefined, { refetchInterval: 120_000 });
  const summary = trpc.intelligence.summary.useQuery();
  const statistics = trpc.intelligence.statistics.useQuery();
  const scorecards = trpc.intelligence.scorecards.useQuery();
  const trends = trpc.intelligence.trends.useQuery();
  const wheel = trpc.intelligence.wheel.useQuery();
  const lifeAreas = trpc.intelligence.lifeAreas.useQuery();
  const attention = trpc.intelligence.attention.useQuery();
  const matrix = trpc.intelligence.priorityMatrix.useQuery();
  const milestones = trpc.intelligence.milestones.useQuery();
  const achievements = trpc.intelligence.achievements.useQuery();

  // Config + history.
  const preferences = trpc.intelligence.preferences.useQuery();
  const collections = trpc.intelligence.listCollections.useQuery();
  const reviews = trpc.intelligence.listReviews.useQuery();
  const reports = trpc.intelligence.listReports.useQuery();

  const refresh = () => utils.intelligence.invalidate();

  const savePreferences = trpc.intelligence.savePreferences.useMutation({
    onSuccess: () => utils.intelligence.preferences.invalidate(),
  });

  const createCollection = trpc.intelligence.createCollection.useMutation({ onSuccess: refresh });
  const deleteCollection = trpc.intelligence.deleteCollection.useMutation({ onSuccess: refresh });

  const generateReview = trpc.intelligence.generateReview.useMutation({
    onSuccess: () => {
      utils.intelligence.listReviews.invalidate();
      toaster.success("Review captured");
      timeline.emit({ kind: "review.generated", source: "dashboard", title: "Review generated" });
      analytics.track({ kind: "dashboard.overall", value: summary.data?.overall ?? 0 });
    },
  });

  const generateReport = trpc.intelligence.generateReport.useMutation({
    onSuccess: () => {
      utils.intelligence.listReports.invalidate();
      toaster.success("Report generated");
      timeline.emit({ kind: "report.generated", source: "dashboard", title: "Report generated" });
    },
  });

  const isLoading = dashboard.isLoading || summary.isLoading;

  return {
    dashboard: dashboard.data,
    summary: summary.data,
    statistics: statistics.data,
    scorecards: scorecards.data ?? [],
    trends: trends.data ?? [],
    wheel: wheel.data ?? [],
    lifeAreas: lifeAreas.data ?? [],
    attention: attention.data ?? [],
    matrix: matrix.data ?? [],
    milestones: milestones.data ?? [],
    achievements: achievements.data ?? [],
    preferences: preferences.data,
    collections: collections.data ?? [],
    reviews: reviews.data ?? [],
    reports: reports.data ?? [],
    isLoading,
    savePreferences: savePreferences.mutate,
    createCollection: createCollection.mutate,
    deleteCollection: deleteCollection.mutate,
    generateReview: (period: ReviewPeriod) => generateReview.mutate({ period }),
    generateReport: (period: ReviewPeriod) => generateReport.mutate({ period }),
  };
}
