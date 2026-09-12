"use client";

import { Card, CardContent, CardHeader, CardTitle, Text } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useShellStore } from "@/lib/shell/store";
import { useFinance } from "./use-finance";
import { AccountsCard } from "./AccountsCard";
import { AccountManagerDialog } from "./AccountManagerDialog";
import { CategoryManagerDialog } from "./CategoryManagerDialog";
import { RecordEntryDialog } from "./RecordEntryDialog";
import { QuickTransaction } from "./QuickTransaction";
import { TransactionsTable } from "./TransactionsTable";
import { FinanceSearch } from "./FinanceSearch";
import { BudgetsCard } from "./BudgetsCard";
import { SubscriptionsCard } from "./SubscriptionsCard";
import { CashFlowCard } from "./CashFlowCard";
import { SavingsCard } from "./SavingsCard";
import { ForecastCard } from "./ForecastCard";
import { SpendingAnalysis } from "./SpendingAnalysis";
import { formatMoney } from "./finance-icons";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * Finance page (Sprint 2.11). A dashboard of accounts, transactions, budgets,
 * subscriptions, cash flow, savings and a rule-based forecast. Selecting an
 * account feeds the shared context panel.
 */
export function FinancePage() {
  const finance = useFinance();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  if (finance.isLoading) return <PageLoading label="Opening your finances…" />;

  const select = (id: string) => {
    finance.selectAccount(id);
    openContextPanel(true);
  };

  const summary = finance.summary;

  return (
    <PageContainer width="full">
      <PageContent>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AccountManagerDialog controller={finance} />
          <CategoryManagerDialog controller={finance} />
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Panel title="Net worth">
              <span className="text-heading-l font-mono tabular-nums">
                {formatMoney(summary.netWorth)}
              </span>
            </Panel>
            <Panel title="Cash available">
              <span className="text-heading-l font-mono tabular-nums">
                {formatMoney(summary.cashAvailable)}
              </span>
            </Panel>
            <Panel title="Budget used">
              <span className="text-heading-l font-mono tabular-nums">
                {summary.overallBudgetPercent}%
              </span>
            </Panel>
            <Panel title="Recurring / mo">
              <span className="text-heading-l font-mono tabular-nums">
                {formatMoney(summary.subscriptions.monthlyRecurring)}
              </span>
            </Panel>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Accounts">
            <AccountsCard
              accounts={finance.accounts.filter((a) => !a.archived)}
              selectedId={finance.selectedAccountId}
              onSelect={select}
            />
          </Panel>

          <Panel title="Cash flow">
            {summary ? <CashFlowCard cashFlow={summary.cashFlow} /> : null}
          </Panel>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <RecordEntryDialog controller={finance} />
                <Text variant="caption" tone="subtle">
                  or type it below
                </Text>
              </div>
              <QuickTransaction
                accountId={finance.selectedAccountId}
                onAdd={finance.addTransaction}
              />
              <FinanceSearch value={finance.query} onChange={finance.setQuery} />
              <TransactionsTable
                transactions={finance.view.slice(0, 30)}
                onDelete={finance.removeTransaction}
              />
            </CardContent>
          </Card>

          <Panel title="Budgets">
            <BudgetsCard budgets={summary?.budgets ?? []} />
          </Panel>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Spending analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingAnalysis
                transactions={finance.transactions}
                customCategories={finance.customCategories}
              />
            </CardContent>
          </Card>

          <Panel title="Subscriptions">
            <SubscriptionsCard
              subscriptions={finance.subscriptions}
              summary={summary?.subscriptions ?? null}
            />
          </Panel>

          <Panel title="Savings">
            <SavingsCard goals={finance.savings} onContribute={finance.contribute} />
          </Panel>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              {finance.forecast ? <ForecastCard forecast={finance.forecast} /> : null}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}
