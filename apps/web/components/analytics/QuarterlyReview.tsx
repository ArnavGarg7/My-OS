"use client";

import { trpc } from "@/lib/trpc/client";
import { PageLoading } from "@/components/framework";
import { ReviewView } from "./WeeklyReview";

/** QuarterlyReview (Sprint 2.14). This quarter's deterministic review. */
export function QuarterlyReview() {
  const q = trpc.analytics.quarterlyReview.useQuery();
  if (q.isLoading) return <PageLoading label="Assembling your quarter…" />;
  if (!q.data) return null;
  return <ReviewView review={q.data} />;
}
