"use client";

import { Text } from "@myos/ui";
import { spendByCategory, type Transaction } from "@myos/core/finance";
import { formatMoney } from "./finance-icons";

/**
 * FinanceTimeline (Sprint 2.11). A compact spend-by-category breakdown for the
 * visible transactions — a deterministic mini-analytic, not the Timeline page.
 */
export function FinanceTimeline({ transactions }: { transactions: Transaction[] }) {
  const spread = spendByCategory(transactions);
  if (spread.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No spending to break down yet.
      </Text>
    );
  }
  const max = spread[0]!.amount || 1;
  return (
    <div className="flex flex-col gap-2">
      {spread.slice(0, 6).map((row) => (
        <div key={row.category} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Text variant="caption" className="capitalize">
              {row.category}
            </Text>
            <Text variant="caption" tone="subtle" className="tabular-nums">
              {formatMoney(row.amount)}
            </Text>
          </div>
          <div className="bg-elevated h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-accent h-full rounded-full"
              style={{ width: `${Math.round((row.amount / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
