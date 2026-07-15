"use client";

import { Wallet } from "lucide-react";
import { Text } from "@myos/ui";
import { filterTransactions } from "@myos/core/finance";
import { useFinance } from "./use-finance";
import { CashFlowCard } from "./CashFlowCard";
import { ForecastCard } from "./ForecastCard";
import { TransactionsTable } from "./TransactionsTable";
import { formatMoney } from "./finance-icons";

/**
 * Finance context panel (Sprint 2.11). With an account selected, shows its
 * recent transactions; otherwise a portfolio snapshot (cash, cash flow,
 * budget, forecast).
 */
export function FinanceContextPanel() {
  const finance = useFinance();
  const account = finance.selectedAccount;
  const summary = finance.summary;

  if (account) {
    const recent = filterTransactions(finance.transactions, { accountId: account.id }).slice(0, 8);
    return (
      <div className="flex flex-col gap-4 p-4">
        <div>
          <Text variant="heading-s">{account.name}</Text>
          <Text variant="body-m" className="tabular-nums">
            {formatMoney(account.balance)}
          </Text>
        </div>
        <TransactionsTable transactions={recent} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Wallet size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Finance</Text>
      </span>
      {summary ? (
        <>
          <div>
            <Text variant="caption" tone="subtle">
              Cash available
            </Text>
            <Text variant="body-m" className="tabular-nums">
              {formatMoney(summary.cashAvailable)}
            </Text>
          </div>
          <CashFlowCard cashFlow={summary.cashFlow} />
          {finance.forecast && <ForecastCard forecast={finance.forecast} />}
        </>
      ) : (
        <Text variant="body-s" tone="subtle">
          Select an account to see its transactions.
        </Text>
      )}
    </div>
  );
}
