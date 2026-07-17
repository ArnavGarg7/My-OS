import { round2 } from "./dates";
import type { InvestmentAccount, InvestmentPosition } from "./types";

/**
 * Finance bridge (Sprint 4.3). The seam between the Resource platform and Finance (2.11).
 *
 * This module deliberately does NOT import `@myos/core/finance` and does not recompute a
 * single Finance number. Balances, cash flow and budgets belong to Finance; liabilities are
 * *supplied* to us through `FinanceBridgeInput` by the server, which is the only place both
 * engines meet. Resource answers "what do I own"; Finance answers "how am I using my money".
 * Keeping the arrow one-directional is what stops the two from drifting apart.
 */

/** What Finance hands the Resource platform. Ids and totals only — never logic. */
export interface FinanceBridgeInput {
  /** Sum of outstanding credit/loan balances, already derived by Finance. */
  liabilities: number;
  /** Cash + bank balances, already derived by Finance. */
  cashBalance: number;
}

export function emptyBridge(): FinanceBridgeInput {
  return { liabilities: 0, cashBalance: 0 };
}

/**
 * Net worth = liquid cash + investments + assets − liabilities. Every input is derived by
 * whichever engine owns it; this function only adds them up.
 */
export function netWorth(input: {
  cashBalance: number;
  investmentValue: number;
  assetValue: number;
  liabilities: number;
}): number {
  return round2(input.cashBalance + input.investmentValue + input.assetValue - input.liabilities);
}

/** Investment accounts that are wired to a Finance account. */
export function linkedAccounts(accounts: InvestmentAccount[]): InvestmentAccount[] {
  return accounts.filter((a) => a.financeAccountId !== null);
}

export function unlinkedAccounts(accounts: InvestmentAccount[]): InvestmentAccount[] {
  return accounts.filter((a) => a.financeAccountId === null);
}

/** Positions belonging to one investment account. */
export function positionsFor(
  positions: InvestmentPosition[],
  accountId: string,
): InvestmentPosition[] {
  return positions.filter((p) => p.accountId === accountId);
}

/** Market value held per investment account — the accounts view's headline number. */
export function valueByAccount(
  accounts: InvestmentAccount[],
  positions: InvestmentPosition[],
): { account: InvestmentAccount; value: number }[] {
  return accounts
    .map((a) => ({
      account: a,
      value: round2(
        positionsFor(positions, a.id).reduce((s, p) => s + p.quantity * p.currentPrice, 0),
      ),
    }))
    .sort((x, y) => y.value - x.value);
}
