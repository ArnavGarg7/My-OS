"use client";

import { trpc } from "@/lib/trpc/client";
import { MetricBar, ScoreTile } from "./AnalyticsCharts";

/** FinanceDashboard (Sprint 2.14). Financial-health score + cash flow. */
export function FinanceDashboard() {
  const q = trpc.analytics.finance.useQuery();
  const f = q.data;
  if (!f) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScoreTile label="Finance score" score={f.score} />
      <MetricBar label="Net cash flow" value={`₹${Math.round(f.netCashFlow)}`} />
      <MetricBar
        label="Budget adherence"
        value={`${f.budgetAdherence}%`}
        percent={f.budgetAdherence}
      />
      <MetricBar label="Savings rate" value={`${f.savingsRate}%`} percent={f.savingsRate} />
      <MetricBar label="Subscriptions" value={`₹${Math.round(f.subscriptionCost)}/mo`} />
    </div>
  );
}
