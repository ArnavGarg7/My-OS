"use client";

import { trpc } from "@/lib/trpc/client";
import { PageLoading } from "@/components/framework";
import { ReviewView } from "./WeeklyReview";

/** MonthlyReview (Sprint 2.14). This month's deterministic review. */
export function MonthlyReview() {
  const q = trpc.analytics.monthlyReview.useQuery();
  if (q.isLoading) return <PageLoading label="Assembling your month…" />;
  if (!q.data) return null;
  return <ReviewView review={q.data} />;
}
