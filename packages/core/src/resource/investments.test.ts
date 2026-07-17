import { describe, expect, it } from "vitest";
import {
  allocation,
  averageCost,
  buildPortfolio,
  cagr,
  costBasis,
  diversification,
  marketValue,
  netQuantity,
  valuePosition,
} from "./investments";
import { FIXED_NOW, makeInvestmentTransaction, makePosition } from "./fixtures";

describe("investments — cost basis from the transaction ledger", () => {
  it("averages the cost of successive buys, including fees", () => {
    const txs = [
      makeInvestmentTransaction({ id: "a", quantity: 10, price: 100, fees: 0 }),
      makeInvestmentTransaction({
        id: "b",
        quantity: 10,
        price: 200,
        fees: 0,
        occurredAt: "2026-02-01T09:00:00.000Z",
      }),
    ];
    expect(averageCost(txs)).toBe(150);
    expect(netQuantity(txs)).toBe(20);
  });

  it("folds fees into the average cost", () => {
    const txs = [makeInvestmentTransaction({ quantity: 10, price: 100, fees: 100 })];
    // (10*100 + 100) / 10 = 110
    expect(averageCost(txs)).toBe(110);
  });

  it("retires sold units at the running average, leaving it unchanged", () => {
    const txs = [
      makeInvestmentTransaction({ id: "a", quantity: 10, price: 100 }),
      makeInvestmentTransaction({
        id: "b",
        quantity: 5,
        price: 500,
        direction: "sell",
        occurredAt: "2026-03-01T09:00:00.000Z",
      }),
    ];
    // Selling high does not retroactively change what the remaining units cost.
    expect(averageCost(txs)).toBe(100);
    expect(netQuantity(txs)).toBe(5);
  });

  it("orders by date, not array order", () => {
    const txs = [
      makeInvestmentTransaction({
        id: "late",
        quantity: 10,
        price: 200,
        occurredAt: "2026-06-01T09:00:00.000Z",
      }),
      makeInvestmentTransaction({
        id: "early",
        quantity: 10,
        price: 100,
        occurredAt: "2026-01-01T09:00:00.000Z",
      }),
    ];
    expect(averageCost(txs)).toBe(150);
  });

  it("returns 0 average when everything is sold", () => {
    const txs = [
      makeInvestmentTransaction({ id: "a", quantity: 10, price: 100 }),
      makeInvestmentTransaction({
        id: "b",
        quantity: 10,
        direction: "sell",
        price: 150,
        occurredAt: "2026-03-01T09:00:00.000Z",
      }),
    ];
    expect(netQuantity(txs)).toBe(0);
    expect(averageCost(txs)).toBe(0);
  });
});

describe("investments — valuation", () => {
  it("computes basis, value and gain from user-entered price", () => {
    const p = makePosition({ quantity: 10, averageCost: 100, currentPrice: 150 });
    expect(costBasis(p)).toBe(1000);
    expect(marketValue(p)).toBe(1500);
    const v = valuePosition(p);
    expect(v.gain).toBe(500);
    expect(v.gainPercent).toBe(50);
  });

  it("reports a loss as a negative gain", () => {
    const p = makePosition({ quantity: 10, averageCost: 200, currentPrice: 150 });
    const v = valuePosition(p);
    expect(v.gain).toBe(-500);
    expect(v.gainPercent).toBe(-25);
  });

  it("gainPercent is 0 rather than Infinity on a zero basis", () => {
    const p = makePosition({ quantity: 10, averageCost: 0, currentPrice: 150 });
    expect(valuePosition(p).gainPercent).toBe(0);
  });
});

describe("investments — CAGR", () => {
  it("annualises growth from the first buy", () => {
    // Bought 1 year before FIXED_NOW at 100, now worth 150 → ~50% CAGR.
    const p = makePosition({ quantity: 10, averageCost: 100, currentPrice: 150 });
    const txs = [makeInvestmentTransaction({ occurredAt: "2025-07-16T10:00:00.000Z" })];
    expect(cagr(p, txs, FIXED_NOW)).toBeGreaterThan(49);
    expect(cagr(p, txs, FIXED_NOW)).toBeLessThan(51);
  });

  it("is 0 for a holding younger than a day — no extrapolating from noise", () => {
    const p = makePosition();
    const txs = [makeInvestmentTransaction({ occurredAt: FIXED_NOW.toISOString() })];
    expect(cagr(p, txs, FIXED_NOW)).toBe(0);
  });

  it("is 0 with no buy history", () => {
    expect(cagr(makePosition(), [], FIXED_NOW)).toBe(0);
  });
});

describe("investments — allocation + diversification", () => {
  it("groups by type and shares sum to 1", () => {
    const positions = [
      makePosition({ id: "a", type: "stock", quantity: 10, currentPrice: 100 }),
      makePosition({ id: "b", type: "crypto", quantity: 10, currentPrice: 100 }),
    ];
    const slices = allocation(positions);
    expect(slices).toHaveLength(2);
    expect(slices[0]?.share).toBe(0.5);
    expect(slices.reduce((s, x) => s + x.share, 0)).toBe(1);
  });

  it("diversification is 0 for a single-type portfolio and rises as it spreads", () => {
    const one = [makePosition({ type: "stock", quantity: 10, currentPrice: 100 })];
    expect(diversification(one)).toBe(0);
    const two = [
      makePosition({ id: "a", type: "stock", quantity: 10, currentPrice: 100 }),
      makePosition({ id: "b", type: "gold", quantity: 10, currentPrice: 100 }),
    ];
    expect(diversification(two)).toBe(0.5);
  });

  it("empty portfolio diversification is 0, not NaN", () => {
    expect(diversification([])).toBe(0);
  });
});

describe("investments — portfolio", () => {
  it("flags concentration above the limit and names the type", () => {
    const positions = [
      makePosition({ id: "a", type: "crypto", quantity: 10, currentPrice: 100 }),
      makePosition({ id: "b", type: "stock", quantity: 1, currentPrice: 100 }),
    ];
    const p = buildPortfolio(positions);
    expect(p.unbalanced).toBe(true);
    expect(p.concentratedIn).toBe("crypto");
  });

  it("an evenly-split portfolio is balanced", () => {
    const positions = [
      makePosition({ id: "a", type: "stock", quantity: 10, currentPrice: 100 }),
      makePosition({ id: "b", type: "gold", quantity: 10, currentPrice: 100 }),
      makePosition({ id: "c", type: "bond", quantity: 10, currentPrice: 100 }),
    ];
    const p = buildPortfolio(positions);
    expect(p.unbalanced).toBe(false);
    expect(p.concentratedIn).toBeNull();
  });

  it("totals basis/value/gain and sorts positions by value", () => {
    const positions = [
      makePosition({ id: "small", quantity: 1, averageCost: 100, currentPrice: 100 }),
      makePosition({ id: "big", quantity: 10, averageCost: 100, currentPrice: 150 }),
    ];
    const p = buildPortfolio(positions);
    expect(p.costBasis).toBe(1100);
    expect(p.marketValue).toBe(1600);
    expect(p.gain).toBe(500);
    expect(p.positions[0]?.positionId).toBe("big");
  });

  it("an empty portfolio is all zeros, not NaN", () => {
    const p = buildPortfolio([]);
    expect(p.marketValue).toBe(0);
    expect(p.gainPercent).toBe(0);
    expect(p.unbalanced).toBe(false);
  });
});
