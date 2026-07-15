import { describe, expect, it } from "vitest";
import {
  at,
  day,
  makeAccount,
  makeBudget,
  makeSavingsGoal,
  makeSubscription,
  makeTransaction,
} from "./fixtures";
import { financeSignals, financeSummary, type SummaryInput } from "./summaries";

function input(over: Partial<SummaryInput> = {}): SummaryInput {
  return {
    date: "2026-07-15",
    accounts: [makeAccount({ id: "a1", type: "checking", openingBalance: 20000 })],
    transactions: [
      makeTransaction({
        id: "t1",
        accountId: "a1",
        direction: "expense",
        category: "groceries",
        amount: 2000,
        occurredAt: at(2026, 6, 3),
      }),
      makeTransaction({
        id: "t2",
        accountId: "a1",
        direction: "income",
        category: "income",
        amount: 5000,
        occurredAt: at(2026, 6, 1),
      }),
    ],
    budgets: [makeBudget({ category: "groceries", monthlyLimit: 5000 })],
    subscriptions: [
      makeSubscription({ amount: 500, billingCycle: "monthly", nextPayment: day(2026, 6, 20) }),
    ],
    savings: [makeSavingsGoal({ targetAmount: 100000, currentAmount: 95000 })],
    now: new Date(Date.UTC(2026, 6, 15, 12)),
    ...over,
  };
}

describe("financeSummary", () => {
  it("assembles a full summary", () => {
    const s = financeSummary(input());
    expect(s.cashAvailable).toBe(23000); // 20000 + 5000 - 2000
    expect(s.cashFlow.net).toBe(3000);
    expect(s.budgets[0]?.usagePercent).toBe(40);
    expect(s.overallBudgetPercent).toBe(40);
    expect(s.subscriptions.monthlyRecurring).toBe(500);
    expect(s.savings[0]?.progressPercent).toBe(95);
  });

  it("derives net worth", () => {
    const s = financeSummary(input());
    expect(s.netWorth).toBe(23000);
  });
});

describe("financeSignals", () => {
  it("flags over-budget categories", () => {
    const s = financeSignals(
      input({
        transactions: [
          makeTransaction({
            category: "groceries",
            direction: "expense",
            amount: 6000,
            occurredAt: at(2026, 6, 3),
          }),
        ],
      }),
    );
    expect(s.overBudgetCategories).toContain("groceries");
  });

  it("surfaces a savings goal nearly complete", () => {
    const s = financeSignals(input());
    expect(s.savingsNearlyComplete?.title).toBe("Emergency fund");
  });

  it("flags a large payment due today", () => {
    const s = financeSignals(
      input({
        subscriptions: [
          makeSubscription({ name: "Rent", amount: 15000, nextPayment: day(2026, 6, 15) }),
        ],
      }),
    );
    expect(s.largePaymentDueToday?.name).toBe("Rent");
  });

  it("reports cash-flow direction + recurring", () => {
    const s = financeSignals(input());
    expect(s.cashFlowDirection).toBe("positive");
    expect(s.monthlyRecurring).toBe(500);
  });
});
