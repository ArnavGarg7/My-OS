"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn, Text } from "@myos/ui";
import type { CashFlow } from "@myos/core/finance";
import { formatMoney } from "./finance-icons";

/** CashFlowCard (Sprint 2.11). Income vs expenses + net for the month. */
export function CashFlowCard({ cashFlow }: { cashFlow: CashFlow }) {
  const tone =
    cashFlow.direction === "positive"
      ? "text-success"
      : cashFlow.direction === "negative"
        ? "text-danger"
        : "text-fg-subtle";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <ArrowDownLeft size={14} aria-hidden className="text-success" />
          <Text variant="body-s" tone="subtle">
            Income
          </Text>
        </span>
        <Text variant="body-s" className="tabular-nums">
          {formatMoney(cashFlow.income)}
        </Text>
      </div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <ArrowUpRight size={14} aria-hidden className="text-danger" />
          <Text variant="body-s" tone="subtle">
            Expenses
          </Text>
        </span>
        <Text variant="body-s" className="tabular-nums">
          {formatMoney(cashFlow.expenses)}
        </Text>
      </div>
      <div className="border-border flex items-center justify-between border-t pt-2">
        <Text variant="body-s">Net</Text>
        <Text variant="body-s" className={cn("font-semibold tabular-nums", tone)}>
          {formatMoney(cashFlow.net)}
        </Text>
      </div>
    </div>
  );
}
