import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ accounts: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("../finance", () => ({ financeService: { accounts: h.accounts } }));

import { financeBridge } from "./bridge";

const db = {} as never;

/** Finance's `accounts()` already returns each account with its derived balance. */
function acct(type: string, balance: number, id = type) {
  return { id, name: id, type, currency: "INR", openingBalance: 0, institution: "", balance };
}

beforeEach(() => vi.clearAllMocks());

describe("finance bridge — the one place the two platforms meet", () => {
  it("sums checking, savings and cash into liquid cash", async () => {
    h.accounts.mockResolvedValue([
      acct("checking", 10_000),
      acct("savings", 50_000),
      acct("cash", 2_000),
    ]);
    const bridge = await financeBridge(db);
    expect(bridge.cashBalance).toBe(62_000);
    expect(bridge.liabilities).toBe(0);
  });

  it("turns a negative credit balance into a positive liability", async () => {
    h.accounts.mockResolvedValue([acct("credit", -15_000)]);
    const bridge = await financeBridge(db);
    expect(bridge.liabilities).toBe(15_000);
    expect(bridge.cashBalance).toBe(0);
  });

  it("ignores a credit card that is in credit rather than counting it as negative debt", async () => {
    h.accounts.mockResolvedValue([acct("credit", 500)]);
    expect((await financeBridge(db)).liabilities).toBe(0);
  });

  it("EXCLUDES investment accounts — the resource engine values those from its own prices", async () => {
    // Counting the Finance-side balance here as well would double them into net worth.
    h.accounts.mockResolvedValue([acct("checking", 1_000), acct("investment", 999_999)]);
    const bridge = await financeBridge(db);
    expect(bridge.cashBalance).toBe(1_000);
    expect(bridge.liabilities).toBe(0);
  });

  it("uses the balance Finance derived — it never recomputes one", async () => {
    // The bridge must not look at openingBalance or transactions; only `balance`.
    h.accounts.mockResolvedValue([{ ...acct("checking", 42), openingBalance: 1_000_000 }]);
    expect((await financeBridge(db)).cashBalance).toBe(42);
  });

  it("handles a mixed set of accounts", async () => {
    h.accounts.mockResolvedValue([
      acct("checking", 20_000),
      acct("savings", 30_000),
      acct("credit", -8_000),
      acct("investment", 500_000),
    ]);
    const bridge = await financeBridge(db);
    expect(bridge.cashBalance).toBe(50_000);
    expect(bridge.liabilities).toBe(8_000);
  });

  it("an empty Finance contributes nothing", async () => {
    h.accounts.mockResolvedValue([]);
    expect(await financeBridge(db)).toEqual({ cashBalance: 0, liabilities: 0 });
  });
});
