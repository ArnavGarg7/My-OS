"use client";

import { useMemo, useState } from "react";
import { searchTransactions, type CreateTransactionInputSchema } from "@myos/core/finance";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Client finance controller (Sprint 2.11). Fetches accounts / transactions /
 * budgets / subscriptions / savings / summary, derives the transaction view, and
 * exposes the lifecycle mutations. Emits timeline + analytics events. Selection
 * is shared with the context panel via the shell store.
 */
export function useFinance() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  const selectedAccountId = useShellStore((s) => s.selectedAccountId);
  const setSelectedAccountId = useShellStore((s) => s.setSelectedAccountId);

  const [query, setQuery] = useState("");

  const accountsQuery = trpc.finance.accounts.useQuery();
  const txnsQuery = trpc.finance.transactions.useQuery();
  const budgetsQuery = trpc.finance.budgets.useQuery();
  const subsQuery = trpc.finance.subscriptions.useQuery();
  const savingsQuery = trpc.finance.savings.useQuery();
  const summaryQuery = trpc.finance.summary.useQuery();
  const forecastQuery = trpc.finance.forecast.useQuery();

  const transactions = useMemo(() => txnsQuery.data ?? [], [txnsQuery.data]);
  const view = useMemo(() => searchTransactions(transactions, query), [transactions, query]);

  const refresh = () => {
    utils.finance.accounts.invalidate();
    utils.finance.transactions.invalidate();
    utils.finance.summary.invalidate();
    utils.finance.forecast.invalidate();
  };

  const createTxn = trpc.finance.createTransaction.useMutation({
    onSuccess: (tx) => {
      refresh();
      toaster.success("Transaction added");
      timeline.emit({
        kind: "finance.transaction",
        source: "finance",
        title: tx.merchant || tx.category,
        meta: { id: tx.id },
      });
      analytics.track({
        kind: tx.direction === "income" ? "finance.income" : "finance.expense",
        value: tx.amount,
      });
    },
    onError: (e) => toaster.error("Couldn't add transaction", e.message),
  });
  const deleteTxn = trpc.finance.deleteTransaction.useMutation({ onSuccess: refresh });
  const createAccountM = trpc.finance.createAccount.useMutation({
    onSuccess: () => {
      utils.finance.accounts.invalidate();
      toaster.success("Account created");
    },
  });
  const transferM = trpc.finance.transfer.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Transfer complete");
    },
    onError: (e) => toaster.error("Transfer failed", e.message),
  });
  const createBudgetM = trpc.finance.createBudget.useMutation({
    onSuccess: () => {
      utils.finance.budgets.invalidate();
      utils.finance.summary.invalidate();
      toaster.success("Budget created");
    },
  });
  const createSubM = trpc.finance.createSubscription.useMutation({
    onSuccess: () => {
      utils.finance.subscriptions.invalidate();
      toaster.success("Subscription added");
    },
  });
  const createGoalM = trpc.finance.createSavingsGoal.useMutation({
    onSuccess: () => {
      utils.finance.savings.invalidate();
      toaster.success("Savings goal created");
    },
  });
  const contributeM = trpc.finance.contribute.useMutation({
    onSuccess: (goal) => {
      utils.finance.savings.invalidate();
      if (goal.completedAt) {
        timeline.emit({ kind: "saving.completed", source: "finance", title: goal.title });
        toaster.success("Goal reached! 🎉");
      }
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    transactions,
    view,
    budgets: budgetsQuery.data ?? [],
    subscriptions: subsQuery.data ?? [],
    savings: savingsQuery.data ?? [],
    summary: summaryQuery.data ?? null,
    forecast: forecastQuery.data ?? null,
    isLoading: accountsQuery.isLoading || summaryQuery.isLoading,
    query,
    setQuery,
    selectedAccountId,
    selectedAccount: (accountsQuery.data ?? []).find((a) => a.id === selectedAccountId) ?? null,
    selectAccount: (id: string | null) => setSelectedAccountId(id),
    addTransaction: (input: CreateTransactionInputSchema) => createTxn.mutate(input),
    removeTransaction: (id: string) => deleteTxn.mutate({ id }),
    createAccount: (input: Parameters<typeof createAccountM.mutate>[0]) =>
      createAccountM.mutate(input),
    transfer: (input: Parameters<typeof transferM.mutate>[0]) => transferM.mutate(input),
    createBudget: (input: Parameters<typeof createBudgetM.mutate>[0]) =>
      createBudgetM.mutate(input),
    createSubscription: (input: Parameters<typeof createSubM.mutate>[0]) =>
      createSubM.mutate(input),
    createSavingsGoal: (input: Parameters<typeof createGoalM.mutate>[0]) =>
      createGoalM.mutate(input),
    contribute: (id: string, amount: number) => contributeM.mutate({ id, amount }),
    pending: createTxn.isPending || transferM.isPending,
  };
}
