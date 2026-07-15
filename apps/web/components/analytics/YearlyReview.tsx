"use client";

import { trpc } from "@/lib/trpc/client";
import { PageLoading } from "@/components/framework";
import { ReviewView } from "./WeeklyReview";

/** YearlyReview (Sprint 2.14). This year's deterministic review. */
export function YearlyReview() {
  const q = trpc.analytics.yearlyReview.useQuery();
  if (q.isLoading) return <PageLoading label="Assembling your year…" />;
  if (!q.data) return null;
  return <ReviewView review={q.data} />;
}
