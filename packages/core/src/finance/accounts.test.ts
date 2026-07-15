import { describe, expect, it } from "vitest";
import { at, makeAccount, makeTransaction } from "./fixtures";
import { accountBalance, cashAvailable, netWorth, transferLegs } from "./accounts";

describe("accounts", () => {
  it("derives balance from opening + transactions", () => {
    const account = makeAccount({ id: "a1", openingBalance: 10000 });
    const txns = [
      makeTransaction({ id: "t1", accountId: "a1", direction: "income", amount: 5000 }),
      makeTransaction({ id: "t2", accountId: "a1", direction: "expense", amount: 2000 }),
    ];
    expect(accountBalance(account, txns)).toBe(13000);
  });

  it("only counts the account's own transactions", () => {
    const account = makeAccount({ id: "a1", openingBalance: 0 });
    const txns = [makeTransaction({ accountId: "a2", direction: "expense", amount: 500 })];
    expect(accountBalance(account, txns)).toBe(0);
  });

  it("computes net worth with credit as a liability", () => {
    const accounts = [
      makeAccount({ id: "a1", type: "checking", openingBalance: 10000 }),
      makeAccount({ id: "a2", type: "credit", openingBalance: -3000 }),
    ];
    expect(netWorth(accounts, [])).toBe(7000);
  });

  it("sums liquid cash across cash-like accounts", () => {
    const accounts = [
      makeAccount({ id: "a1", type: "checking", openingBalance: 4000 }),
      makeAccount({ id: "a2", type: "savings", openingBalance: 6000 }),
      makeAccount({ id: "a3", type: "investment", openingBalance: 50000 }),
    ];
    expect(cashAvailable(accounts, [])).toBe(10000);
  });

  it("builds balanced transfer legs that net to zero", () => {
    const [from, to] = transferLegs("a1", "a2", 1000, new Date(at(2026, 6, 7)));
    expect(from.amount).toBe(-1000);
    expect(to.amount).toBe(1000);
    const accounts = [
      makeAccount({ id: "a1", type: "checking", openingBalance: 5000 }),
      makeAccount({ id: "a2", type: "savings", openingBalance: 0 }),
    ];
    const balance =
      accountBalance(accounts[0]!, [from, to]) + accountBalance(accounts[1]!, [from, to]);
    expect(balance).toBe(5000); // transfer preserves total
  });
});
