"use client";

import { Trash2 } from "lucide-react";
import { cn, EmptyState, IconButton, Text } from "@myos/ui";
import { Receipt } from "lucide-react";
import type { Transaction } from "@myos/core/finance";
import { DIRECTION_ICON, DIRECTION_TONE, formatMoney } from "./finance-icons";

/**
 * TransactionsTable (Sprint 2.11). A compact ledger of recent transactions with
 * signed amounts and a delete action.
 */
export function TransactionsTable({
  transactions,
  onDelete,
}: {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Record income and expenses to see your ledger and cash flow."
      />
    );
  }
  return (
    <ul className="divide-border flex flex-col divide-y">
      {transactions.map((t) => {
        const Icon = DIRECTION_ICON[t.direction];
        const sign = t.direction === "income" ? "+" : t.direction === "expense" ? "-" : "";
        return (
          <li key={t.id} className="flex items-center gap-3 py-2">
            <Icon size={15} aria-hidden className={cn("shrink-0", DIRECTION_TONE[t.direction])} />
            <div className="min-w-0 flex-1">
              <Text variant="body-s" className="truncate">
                {t.merchant || t.category}
              </Text>
              <Text variant="caption" tone="subtle">
                {t.category} · {new Date(t.occurredAt).toLocaleDateString()}
              </Text>
            </div>
            <Text
              variant="body-s"
              className={cn("font-medium tabular-nums", DIRECTION_TONE[t.direction])}
            >
              {sign}
              {formatMoney(t.amount)}
            </Text>
            {onDelete && (
              <IconButton
                aria-label="Delete transaction"
                size="icon-sm"
                variant="ghost"
                onClick={() => onDelete(t.id)}
              >
                <Trash2 size={13} aria-hidden />
              </IconButton>
            )}
          </li>
        );
      })}
    </ul>
  );
}
