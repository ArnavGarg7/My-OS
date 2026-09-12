import { describe, expect, it } from "vitest";
import {
  categoryBreakdown,
  incomeVsExpense,
  monthlyTrend,
  resolvePeriod,
  transactionsInRange,
} from "./analysis";
import type { Transaction } from "./types";

function tx(partial: Partial<Transaction> & { amount: number }): Transaction {
  return {
    id: crypto.randomUUID(),
    accountId: "acc",
    amount: partial.amount,
    category: partial.category ?? "other",
    direction: partial.direction ?? "expense",
    merchant: "",
    description: "",
    occurredAt: partial.occurredAt ?? "2026-09-10T10:00:00.000Z",
    createdAt: "2026-09-10T10:00:00.000Z",
    projectId: null,
  };
}

describe("resolvePeriod", () => {
  it("starts the week on Monday", () => {
    // 2026-09-12 is a Saturday → Monday is 2026-09-07.
    const r = resolvePeriod("this-week", "2026-09-12");
    expect(r).toEqual({ start: "2026-09-07", end: "2026-09-12", label: "This week" });
  });

  it("spans the current month to today", () => {
    expect(resolvePeriod("this-month", "2026-09-12")).toEqual({
      start: "2026-09-01",
      end: "2026-09-12",
      label: "This month",
    });
  });

  it("spans the whole previous month", () => {
    expect(resolvePeriod("last-month", "2026-09-12")).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
      label: "Last month",
    });
  });
});

describe("transactionsInRange", () => {
  it("includes both endpoints and excludes outside dates", () => {
    const txns = [
      tx({ amount: 1, occurredAt: "2026-09-01T00:00:00Z" }),
      tx({ amount: 2, occurredAt: "2026-09-15T23:59:00Z" }),
      tx({ amount: 3, occurredAt: "2026-08-31T12:00:00Z" }),
    ];
    const got = transactionsInRange(txns, "2026-09-01", "2026-09-15");
    expect(got.map((t) => t.amount).sort()).toEqual([1, 2]);
  });
});

describe("categoryBreakdown", () => {
  it("sums expenses per category with whole-percent shares, highest first", () => {
    const txns = [
      tx({ amount: 300, category: "groceries" }),
      tx({ amount: 100, category: "groceries" }),
      tx({ amount: 100, category: "dining" }),
      tx({ amount: 500, category: "income", direction: "income" }), // ignored
    ];
    const b = categoryBreakdown(txns);
    expect(b[0]).toEqual({ category: "groceries", amount: 400, percent: 80 });
    expect(b[1]).toEqual({ category: "dining", amount: 100, percent: 20 });
  });
});

describe("incomeVsExpense", () => {
  it("nets income against expenses, ignoring transfers", () => {
    const txns = [
      tx({ amount: 1000, direction: "income" }),
      tx({ amount: 400, direction: "expense" }),
      tx({ amount: 250, direction: "transfer" }),
    ];
    const f = incomeVsExpense(txns);
    expect(f.income).toBe(1000);
    expect(f.expenses).toBe(400);
    expect(f.net).toBe(600);
  });
});

describe("monthlyTrend", () => {
  it("returns a gap-free window ending at today's month, oldest first", () => {
    const txns = [tx({ amount: 200, direction: "expense", occurredAt: "2026-08-05T00:00:00Z" })];
    const t = monthlyTrend(txns, 3, "2026-09-12");
    expect(t.map((p) => p.month)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(t[1]!.expenses).toBe(200);
    expect(t[2]!.expenses).toBe(0);
  });
});
