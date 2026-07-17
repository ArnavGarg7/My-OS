import "server-only";
import type { FinanceBridgeInput } from "@myos/core/resource";
import type { Database } from "@myos/db";
import { financeService } from "../finance";

/**
 * Finance → Resource bridge (Sprint 4.3). The ONE place the two platforms meet.
 *
 * The pure resource core never imports `@myos/core/finance` and never computes a balance.
 * Here we ask Finance for its accounts — `financeService.accounts()` already returns each
 * account with the balance Finance itself derived from its transaction history — and only
 * classify those balances into the two numbers the Resource platform needs. There is no
 * second balance calculation anywhere in this sprint; if Finance changes how a balance is
 * derived, net worth inherits the change for free.
 *
 * Account-type semantics belong to Finance (2.11): checking/savings/cash are liquid and
 * `credit` is a liability. `investment` accounts are deliberately EXCLUDED from both —
 * those holdings are valued by the Resource platform's own investment engine from
 * user-entered prices, and counting the Finance-side balance too would double them into
 * net worth.
 */

const LIQUID_TYPES = new Set(["checking", "savings", "cash"]);
const LIABILITY_TYPES = new Set(["credit"]);

export async function financeBridge(db: Database): Promise<FinanceBridgeInput> {
  const accounts = await financeService.accounts(db);

  let cashBalance = 0;
  let liabilities = 0;
  for (const account of accounts) {
    if (LIQUID_TYPES.has(account.type)) cashBalance += account.balance;
    // A credit account's balance runs negative as debt accrues; a liability is a positive
    // amount owed, so flip the sign and ignore any card that happens to be in credit.
    else if (LIABILITY_TYPES.has(account.type)) liabilities += Math.max(0, -account.balance);
  }

  return { cashBalance, liabilities };
}
