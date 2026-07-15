"use client";

import { TrendingUp } from "lucide-react";
import { cn, Text } from "@myos/ui";
import type { Forecast } from "@myos/core/finance";
import { formatMoney } from "./finance-icons";

/**
 * ForecastCard (Sprint 2.11). Rule-based projected month-end balance + the
 * inputs (avg daily spend, recurring, projected income). No ML.
 */
export function ForecastCard({ forecast }: { forecast: Forecast }) {
  const positive = forecast.projectedMonthEndBalance >= 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s" tone="subtle">
          Projected month-end
        </Text>
        <Text
          variant="body-m"
          className={cn("font-semibold tabular-nums", positive ? "text-success" : "text-danger")}
        >
          {formatMoney(forecast.projectedMonthEndBalance)}
        </Text>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        {[
          ["Avg daily spend", formatMoney(forecast.averageDailySpend)],
          ["Recurring", formatMoney(forecast.recurringExpenses)],
          ["Proj. expenses", formatMoney(forecast.projectedExpenses)],
          ["Proj. income", formatMoney(forecast.projectedIncome)],
        ].map(([label, value]) => (
          <div key={label} className="border-border rounded-md border p-2">
            <dt>
              <Text variant="caption" tone="subtle">
                {label}
              </Text>
            </dt>
            <dd>
              <Text variant="body-s" className="tabular-nums">
                {value}
              </Text>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
