import { describe, expect, it } from "vitest";
import { at, makeBudget, makeTransaction } from "./fixtures";
import {
  allBudgetStatuses,
  budgetStatus,
  exceededCategories,
  monthKey,
  overallUsage,
  spentInCategory,
} from "./budgets";

const month = "2026-07";

describe("budgets", () => {
  it("derives the month key", () => {
    expect(monthKey(at(2026, 6, 7))).toBe("2026-07");
  });

  it("sums spend in a category for the month", () => {
    const txns = [
      makeTransaction({ id: "a", category: "groceries", amount: 1200, occurredAt: at(2026, 6, 3) }),
      makeTransaction({ id: "b", category: "groceries", amount: 800, occurredAt: at(2026, 6, 9) }),
      makeTransaction({ id: "c", category: "dining", amount: 400, occurredAt: at(2026, 6, 9) }),
      makeTransaction({ id: "d", category: "groceries", amount: 500, occurredAt: at(2026, 5, 9) }),
    ];
    expect(spentInCategory(txns, "groceries", month)).toBe(2000);
  });

  it("reports ok / warning / exceeded states", () => {
    const budget = makeBudget({ category: "groceries", monthlyLimit: 5000, warningThreshold: 0.8 });
    const ok = budgetStatus(
      budget,
      [makeTransaction({ amount: 1000, occurredAt: at(2026, 6, 3) })],
      month,
    );
    expect(ok.state).toBe("ok");

    const warning = budgetStatus(
      budget,
      [makeTransaction({ amount: 4200, occurredAt: at(2026, 6, 3) })],
      month,
    );
    expect(warning.state).toBe("warning");

    const exceeded = budgetStatus(
      budget,
      [makeTransaction({ amount: 5500, occurredAt: at(2026, 6, 3) })],
      month,
    );
    expect(exceeded.state).toBe("exceeded");
    expect(exceeded.remaining).toBeLessThan(0);
  });

  it("computes usage percent", () => {
    const s = budgetStatus(
      makeBudget({ monthlyLimit: 5000 }),
      [makeTransaction({ amount: 2500, occurredAt: at(2026, 6, 3) })],
      month,
    );
    expect(s.usagePercent).toBe(50);
  });

  it("skips inactive budgets + computes overall usage", () => {
    const budgets = [
      makeBudget({ id: "b1", category: "groceries", monthlyLimit: 5000, active: true }),
      makeBudget({ id: "b2", category: "dining", monthlyLimit: 3000, active: false }),
    ];
    const txns = [
      makeTransaction({ category: "groceries", amount: 2000, occurredAt: at(2026, 6, 3) }),
    ];
    const statuses = allBudgetStatuses(budgets, txns, month);
    expect(statuses).toHaveLength(1);
    expect(overallUsage(statuses)).toBe(40);
  });

  it("lists exceeded categories", () => {
    const budgets = [makeBudget({ category: "groceries", monthlyLimit: 1000 })];
    const txns = [
      makeTransaction({ category: "groceries", amount: 1500, occurredAt: at(2026, 6, 3) }),
    ];
    expect(exceededCategories(allBudgetStatuses(budgets, txns, month))).toEqual(["groceries"]);
  });
});
