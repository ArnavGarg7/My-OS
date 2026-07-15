import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AccountRow,
  BudgetRow,
  SavingsGoalRow,
  SubscriptionRow,
  TransactionRow,
} from "@myos/db/schema";

// FinanceService is server-only; mock the DB boundary (repository) and verify
// the engine wiring — balances, transfers, budgets, savings, summary + signals.
const h = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  insertAccount: vi.fn(),
  listTransactions: vi.fn(),
  getTransaction: vi.fn(),
  insertTransaction: vi.fn(),
  insertTransactions: vi.fn(),
  deleteTransaction: vi.fn(),
  listBudgets: vi.fn(),
  insertBudget: vi.fn(),
  listSubscriptions: vi.fn(),
  insertSubscription: vi.fn(),
  listSavings: vi.fn(),
  getSavingsGoal: vi.fn(),
  insertSavingsGoal: vi.fn(),
  updateSavingsGoal: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";
import * as summary from "./summary";
import { forecast } from "./forecasts";

const db = {} as never;
const TZ = "UTC";
const D = (s: string) => new Date(s);

function accountRow(over: Partial<AccountRow> = {}): AccountRow {
  return {
    id: "a1",
    name: "Checking",
    type: "checking",
    currency: "INR",
    openingBalance: 10000,
    institution: "",
    createdAt: D("2026-07-01T00:00:00Z"),
    updatedAt: D("2026-07-01T00:00:00Z"),
    ...over,
  };
}

function txnRow(over: Partial<TransactionRow> = {}): TransactionRow {
  return {
    id: "t1",
    accountId: "a1",
    amount: 500,
    category: "groceries",
    direction: "expense",
    merchant: "Market",
    description: "",
    projectId: null,
    occurredAt: D("2026-07-07T12:00:00Z"),
    createdAt: D("2026-07-07T12:00:00Z"),
    ...over,
  };
}

function budgetRow(over: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: "b1",
    category: "groceries",
    monthlyLimit: 5000,
    warningThreshold: 0.8,
    active: true,
    ...over,
  };
}

function subRow(over: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: "s1",
    name: "Netflix",
    amount: 500,
    billingCycle: "monthly",
    nextPayment: "2026-07-20",
    active: true,
    ...over,
  };
}

function savingsRow(over: Partial<SavingsGoalRow> = {}): SavingsGoalRow {
  return {
    id: "g1",
    title: "Fund",
    targetAmount: 100000,
    currentAmount: 40000,
    deadline: null,
    completedAt: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.listAccounts.mockResolvedValue([]);
  h.listTransactions.mockResolvedValue([]);
  h.listBudgets.mockResolvedValue([]);
  h.listSubscriptions.mockResolvedValue([]);
  h.listSavings.mockResolvedValue([]);
});

describe("accounts", () => {
  it("derives balances from transactions", async () => {
    h.listAccounts.mockResolvedValue([accountRow({ openingBalance: 10000 })]);
    h.listTransactions.mockResolvedValue([txnRow({ direction: "expense", amount: 2000 })]);
    const [a] = await service.accounts(db);
    expect(a?.balance).toBe(8000);
  });

  it("creates an account", async () => {
    h.insertAccount.mockResolvedValue(accountRow());
    const a = await service.createAccount(db, {
      name: "Checking",
      type: "checking",
      openingBalance: 10000,
      institution: "",
    });
    expect(a.name).toBe("Checking");
  });
});

describe("transactions", () => {
  it("creates + validates a transaction", async () => {
    h.insertTransaction.mockResolvedValue(txnRow());
    const t = await service.createTransaction(db, {
      accountId: "a1",
      amount: 500,
      direction: "expense",
    });
    expect(t.amount).toBe(500);
    expect(h.insertTransaction).toHaveBeenCalledOnce();
  });

  it("rejects a zero amount", async () => {
    await expect(
      service.createTransaction(db, { accountId: "a1", amount: 0, direction: "expense" }),
    ).rejects.toThrow(/greater than zero/);
  });

  it("records income + expense", async () => {
    h.insertTransaction.mockResolvedValue(txnRow({ direction: "income", amount: 5000 }));
    const t = await service.record(db, "income", { accountId: "a1", amount: 5000 });
    expect(t.direction).toBe("income");
  });

  it("deletes a transaction", async () => {
    h.deleteTransaction.mockResolvedValue(undefined);
    expect(await service.removeTransaction(db, "t1")).toEqual({ id: "t1" });
  });
});

describe("transfer", () => {
  it("inserts two balanced legs", async () => {
    h.insertTransactions.mockResolvedValue([]);
    await service.transfer(db, { fromAccountId: "a1", toAccountId: "a2", amount: 1000 });
    const legs = h.insertTransactions.mock.calls[0]?.[1] as { amount: number }[];
    expect(legs).toHaveLength(2);
    expect(legs[0]!.amount + legs[1]!.amount).toBe(0);
  });
});

describe("budgets + subscriptions", () => {
  it("creates a budget", async () => {
    h.insertBudget.mockResolvedValue(budgetRow());
    const b = await service.createBudget(db, {
      category: "groceries",
      monthlyLimit: 5000,
      warningThreshold: 0.8,
    });
    expect(b.category).toBe("groceries");
  });

  it("creates a subscription", async () => {
    h.insertSubscription.mockResolvedValue(subRow());
    const s = await service.createSubscription(db, {
      name: "Netflix",
      amount: 500,
      billingCycle: "monthly",
      nextPayment: "2026-07-20",
    });
    expect(s.name).toBe("Netflix");
  });
});

describe("savings", () => {
  it("lists savings progress", async () => {
    h.listSavings.mockResolvedValue([savingsRow({ currentAmount: 40000, targetAmount: 100000 })]);
    const [p] = await service.savings(db);
    expect(p?.progressPercent).toBe(40);
  });

  it("contributes and completes at target", async () => {
    h.getSavingsGoal.mockResolvedValue(savingsRow({ currentAmount: 95000, targetAmount: 100000 }));
    h.updateSavingsGoal.mockImplementation((_db: never, _id: string, patch: never) =>
      Promise.resolve(savingsRow({ ...(patch as object) } as Partial<SavingsGoalRow>)),
    );
    const g = await service.contributeSavings(db, { id: "g1", amount: 5000 });
    expect(g.currentAmount).toBe(100000);
    const persisted = h.updateSavingsGoal.mock.calls[0]?.[2] as { completedAt: Date | null };
    expect(persisted.completedAt).not.toBeNull();
  });
});

describe("summary + signals + search + forecast", () => {
  it("assembles a summary", async () => {
    h.listAccounts.mockResolvedValue([accountRow({ openingBalance: 20000 })]);
    h.listTransactions.mockResolvedValue([
      txnRow({ direction: "expense", amount: 2000, occurredAt: D("2026-07-03T12:00:00Z") }),
    ]);
    h.listBudgets.mockResolvedValue([budgetRow()]);
    const s = await summary.summary(db, TZ, "2026-07-15");
    expect(s.cashAvailable).toBe(18000);
    expect(s.budgets[0]?.usagePercent).toBe(40);
  });

  it("derives signals", async () => {
    h.listBudgets.mockResolvedValue([budgetRow({ monthlyLimit: 1000 })]);
    h.listTransactions.mockResolvedValue([
      txnRow({ category: "groceries", amount: 1500, occurredAt: D("2026-07-03T12:00:00Z") }),
    ]);
    const sig = await summary.signals(db, TZ);
    expect(sig.overBudgetCategories).toContain("groceries");
  });

  it("searches transactions", async () => {
    h.listTransactions.mockResolvedValue([
      txnRow({ id: "a", merchant: "Market" }),
      txnRow({ id: "b", merchant: "Cafe" }),
    ]);
    const results = await summary.search(db, "market");
    expect(results.map((t) => t.id)).toEqual(["a"]);
  });

  it("counts entities", async () => {
    h.listAccounts.mockResolvedValue([accountRow()]);
    h.listTransactions.mockResolvedValue([txnRow()]);
    const c = await summary.counts(db);
    expect(c.accounts).toBe(1);
    expect(c.transactions).toBe(1);
  });

  it("produces a forecast", async () => {
    h.listAccounts.mockResolvedValue([accountRow({ openingBalance: 10000 })]);
    h.listTransactions.mockResolvedValue([txnRow({ direction: "expense", amount: 300 })]);
    h.listSubscriptions.mockResolvedValue([subRow({ amount: 600 })]);
    const f = await forecast(db);
    expect(f.recurringExpenses).toBe(600);
    expect(typeof f.projectedMonthEndBalance).toBe("number");
  });
});
