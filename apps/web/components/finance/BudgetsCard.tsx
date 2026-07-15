"use client";

import { Text } from "@myos/ui";
import type { BudgetStatus } from "@myos/core/finance";
import { BudgetProgress } from "./BudgetProgress";

/** BudgetsCard (Sprint 2.11). Lists each active budget's progress. */
export function BudgetsCard({ budgets }: { budgets: BudgetStatus[] }) {
  if (budgets.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No budgets set — add one to track category spending.
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {budgets.map((status) => (
        <BudgetProgress key={status.budget.id} status={status} />
      ))}
    </div>
  );
}
