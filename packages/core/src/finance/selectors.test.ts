import { describe, expect, it } from "vitest";
import { at, makeTransaction } from "./fixtures";
import {
  expensesForProject,
  filterTransactions,
  searchTransactions,
  sortByRecent,
  totalExpenses,
  totalIncome,
} from "./selectors";

describe("selectors", () => {
  const txns = [
    makeTransaction({
      id: "a",
      category: "groceries",
      direction: "expense",
      amount: 500,
      merchant: "Market",
      occurredAt: at(2026, 6, 3),
    }),
    makeTransaction({
      id: "b",
      category: "income",
      direction: "income",
      amount: 5000,
      merchant: "Employer",
      occurredAt: at(2026, 6, 5),
    }),
    makeTransaction({
      id: "c",
      category: "dining",
      direction: "expense",
      amount: 300,
      merchant: "Cafe",
      occurredAt: at(2026, 6, 7),
    }),
  ];

  it("filters by direction + category", () => {
    expect(filterTransactions(txns, { direction: "income" }).map((t) => t.id)).toEqual(["b"]);
    expect(filterTransactions(txns, { category: "dining" }).map((t) => t.id)).toEqual(["c"]);
  });

  it("sorts by most recent", () => {
    expect(sortByRecent(txns).map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("searches merchant / category", () => {
    expect(searchTransactions(txns, "market").map((t) => t.id)).toEqual(["a"]);
    expect(searchTransactions(txns, "dining").map((t) => t.id)).toEqual(["c"]);
  });

  it("totals income + expenses", () => {
    expect(totalIncome(txns)).toBe(5000);
    expect(totalExpenses(txns)).toBe(800);
  });

  it("finds expenses linked to a project", () => {
    const withProject = [
      makeTransaction({ id: "p", direction: "expense", amount: 100, projectId: "proj1" }),
      makeTransaction({ id: "q", direction: "expense", amount: 200, projectId: null }),
    ];
    expect(expensesForProject(withProject, "proj1").map((t) => t.id)).toEqual(["p"]);
  });
});
