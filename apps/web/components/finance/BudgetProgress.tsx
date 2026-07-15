"use client";

import { cn, Progress, Text } from "@myos/ui";
import type { BudgetStatus } from "@myos/core/finance";
import { BUDGET_TONE, formatMoney } from "./finance-icons";

/**
 * BudgetProgress (Sprint 2.11). One budget's usage bar + remaining, coloured by
 * ok / warning / exceeded state.
 */
export function BudgetProgress({ status }: { status: BudgetStatus }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <Text variant="body-s" className="capitalize">
          {status.budget.category}
        </Text>
        <Text variant="caption" className={cn("tabular-nums", BUDGET_TONE[status.state])}>
          {formatMoney(status.spent)} / {formatMoney(status.budget.monthlyLimit)}
        </Text>
      </div>
      <Progress value={Math.min(100, status.usagePercent)} />
      <Text variant="caption" tone="subtle">
        {status.state === "exceeded"
          ? `Over by ${formatMoney(-status.remaining)}`
          : `${formatMoney(status.remaining)} left`}
      </Text>
    </div>
  );
}
