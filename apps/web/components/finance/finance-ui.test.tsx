import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  Account,
  BudgetStatus,
  CashFlow,
  Forecast,
  SavingsProgress,
  Subscription,
  SubscriptionSummary,
  Transaction,
} from "@myos/core/finance";
import { AccountsCard } from "./AccountsCard";
import { TransactionsTable } from "./TransactionsTable";
import { BudgetProgress } from "./BudgetProgress";
import { BudgetsCard } from "./BudgetsCard";
import { CashFlowCard } from "./CashFlowCard";
import { SubscriptionsCard } from "./SubscriptionsCard";
import { SavingsCard } from "./SavingsCard";
import { ForecastCard } from "./ForecastCard";
import { QuickTransaction } from "./QuickTransaction";
import { TransactionEditor } from "./TransactionEditor";
import { FinanceSearch } from "./FinanceSearch";
import { FinanceTimeline } from "./FinanceTimeline";
import { formatMoney } from "./finance-icons";

const iso = (d: number) => new Date(Date.UTC(2026, 6, d, 12)).toISOString();

function account(over: Partial<Account & { balance: number }> = {}): Account & { balance: number } {
  return {
    id: "a1",
    name: "Checking",
    type: "checking",
    currency: "INR",
    openingBalance: 10000,
    institution: "",
    createdAt: iso(1),
    updatedAt: iso(1),
    balance: 8000,
    ...over,
  };
}

function txn(over: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    accountId: "a1",
    amount: 500,
    category: "groceries",
    direction: "expense",
    merchant: "Market",
    description: "",
    occurredAt: iso(7),
    createdAt: iso(7),
    projectId: null,
    ...over,
  };
}

describe("formatMoney", () => {
  it("formats positive + negative", () => {
    expect(formatMoney(1500)).toBe("₹1,500");
    expect(formatMoney(-200)).toBe("-₹200");
  });
});

describe("AccountsCard", () => {
  it("renders accounts with balances + selects", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountsCard
        accounts={[account({ name: "HDFC Main" })]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("HDFC Main")).toBeInTheDocument();
    expect(screen.getByText("₹8,000")).toBeInTheDocument();
    await user.click(screen.getByText("HDFC Main"));
    expect(onSelect).toHaveBeenCalledWith("a1");
  });

  it("shows an empty message", () => {
    render(<AccountsCard accounts={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText(/No accounts yet/)).toBeInTheDocument();
  });

  it("marks the selected account via aria-pressed", () => {
    render(
      <AccountsCard accounts={[account({ name: "HDFC" })]} selectedId="a1" onSelect={() => {}} />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("TransactionsTable", () => {
  it("renders + deletes a transaction", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[txn()]} onDelete={onDelete} />);
    expect(screen.getByText("Market")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Delete transaction"));
    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("shows an empty state", () => {
    render(<TransactionsTable transactions={[]} />);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });

  it("signs income + and expense -", () => {
    render(
      <TransactionsTable
        transactions={[
          txn({ id: "i", direction: "income", amount: 5000, merchant: "Salary" }),
          txn({ id: "e", direction: "expense", amount: 500, merchant: "Market" }),
        ]}
      />,
    );
    expect(screen.getByText("+₹5,000")).toBeInTheDocument();
    expect(screen.getByText("-₹500")).toBeInTheDocument();
  });
});

describe("BudgetProgress", () => {
  const status: BudgetStatus = {
    budget: {
      id: "b1",
      category: "groceries",
      monthlyLimit: 5000,
      warningThreshold: 0.8,
      active: true,
    },
    spent: 2000,
    remaining: 3000,
    usagePercent: 40,
    state: "ok",
  };

  it("renders spend vs limit + remaining", () => {
    render(<BudgetProgress status={status} />);
    expect(screen.getByText("groceries")).toBeInTheDocument();
    expect(screen.getByText(/₹3,000 left/)).toBeInTheDocument();
  });

  it("shows over-by for an exceeded budget", () => {
    render(
      <BudgetProgress status={{ ...status, state: "exceeded", spent: 6000, remaining: -1000 }} />,
    );
    expect(screen.getByText(/Over by ₹1,000/)).toBeInTheDocument();
  });

  it("lists budgets or empty", () => {
    const { rerender } = render(<BudgetsCard budgets={[status]} />);
    expect(screen.getByText("groceries")).toBeInTheDocument();
    rerender(<BudgetsCard budgets={[]} />);
    expect(screen.getByText(/No budgets set/)).toBeInTheDocument();
  });
});

describe("CashFlowCard", () => {
  it("renders income, expenses + net", () => {
    const cf: CashFlow = { income: 5000, expenses: 2000, net: 3000, direction: "positive" };
    render(<CashFlowCard cashFlow={cf} />);
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
    expect(screen.getByText("₹3,000")).toBeInTheDocument();
  });

  it("renders a negative net", () => {
    const cf: CashFlow = { income: 1000, expenses: 4000, net: -3000, direction: "negative" };
    render(<CashFlowCard cashFlow={cf} />);
    expect(screen.getByText("-₹3,000")).toBeInTheDocument();
  });
});

describe("SubscriptionsCard", () => {
  const sub: Subscription = {
    id: "s1",
    name: "Netflix",
    amount: 500,
    billingCycle: "monthly",
    nextPayment: "2026-07-20",
    active: true,
  };
  const summary: SubscriptionSummary = {
    monthlyRecurring: 500,
    yearlyRecurring: 6000,
    activeCount: 1,
    upcoming: [],
  };

  it("renders recurring totals + subscription", () => {
    render(<SubscriptionsCard subscriptions={[sub]} summary={summary} />);
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText(/₹500\/mo/)).toBeInTheDocument();
  });

  it("shows an empty message with no active subs", () => {
    render(<SubscriptionsCard subscriptions={[{ ...sub, active: false }]} summary={null} />);
    expect(screen.getByText("No active subscriptions.")).toBeInTheDocument();
  });
});

describe("SavingsCard", () => {
  const progress: SavingsProgress = {
    goal: {
      id: "g1",
      title: "Fund",
      targetAmount: 100000,
      currentAmount: 40000,
      deadline: null,
      completedAt: null,
    },
    progressPercent: 40,
    remaining: 60000,
    projectedCompletion: null,
    onTrack: true,
  };

  it("renders progress + contributes", async () => {
    const onContribute = vi.fn();
    const user = userEvent.setup();
    render(<SavingsCard goals={[progress]} onContribute={onContribute} />);
    expect(screen.getByText("Fund")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Add funds…"), "5000");
    await user.click(screen.getByRole("button", { name: /contribute/i }));
    expect(onContribute).toHaveBeenCalledWith("g1", 5000);
  });

  it("shows an empty state", () => {
    render(<SavingsCard goals={[]} />);
    expect(screen.getByText(/No savings goals/)).toBeInTheDocument();
  });
});

describe("ForecastCard", () => {
  const f: Forecast = {
    projectedMonthEndBalance: 12000,
    projectedExpenses: 3000,
    projectedIncome: 5000,
    recurringExpenses: 600,
    averageDailySpend: 100,
  };

  it("renders the projected balance", () => {
    render(<ForecastCard forecast={f} />);
    expect(screen.getByText("₹12,000")).toBeInTheDocument();
  });

  it("shows the forecast inputs", () => {
    render(<ForecastCard forecast={f} />);
    expect(screen.getByText("Avg daily spend")).toBeInTheDocument();
    expect(screen.getByText("Recurring")).toBeInTheDocument();
  });
});

describe("QuickTransaction", () => {
  it("parses a capture into a transaction", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<QuickTransaction accountId="a1" onAdd={onAdd} />);
    await user.type(screen.getByLabelText("Quick transaction"), "Spent 450 on groceries");
    await user.keyboard("{Enter}");
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 450, direction: "expense", category: "groceries" }),
    );
  });

  it("is disabled without an account", () => {
    render(<QuickTransaction accountId={null} onAdd={() => {}} />);
    expect(screen.getByLabelText("Quick transaction")).toBeDisabled();
  });

  it("parses income", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<QuickTransaction accountId="a1" onAdd={onAdd} />);
    await user.type(screen.getByLabelText("Quick transaction"), "Received 50000 salary");
    await user.keyboard("{Enter}");
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ direction: "income" }));
  });
});

describe("TransactionEditor", () => {
  it("saves a structured transaction", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<TransactionEditor accountId="a1" onSave={onSave} />);
    await user.type(screen.getByLabelText("Amount"), "1200");
    await user.type(screen.getByLabelText("Category"), "rent");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1200, category: "rent" }),
    );
  });

  it("disables save without an amount", () => {
    render(<TransactionEditor accountId="a1" onSave={() => {}} />);
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });
});

describe("FinanceSearch + Timeline", () => {
  it("emits search input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FinanceSearch value="" onChange={onChange} />);
    await user.type(screen.getByLabelText("Search transactions"), "x");
    expect(onChange).toHaveBeenCalled();
  });

  it("breaks spend down by category", () => {
    render(
      <FinanceTimeline
        transactions={[
          txn({ id: "a", category: "dining", amount: 900 }),
          txn({ id: "b", category: "groceries", amount: 500 }),
        ]}
      />,
    );
    expect(screen.getByText("dining")).toBeInTheDocument();
    expect(screen.getByText("groceries")).toBeInTheDocument();
  });
});
