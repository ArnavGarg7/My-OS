import { PORTFOLIO_CONCENTRATION_LIMIT, type InvestmentType } from "./constants";
import { round2, yearsBetween } from "./dates";
import type {
  AllocationSlice,
  InvestmentPortfolio,
  InvestmentPosition,
  InvestmentTransaction,
  PositionValuation,
} from "./types";

/**
 * Investment engine (Sprint 4.3). PURE derivations over user-entered positions and prices:
 * cost basis, market value, gains, allocation, diversification and CAGR. There are no
 * market APIs and no price feeds — `currentPrice` is whatever the user last typed, and
 * every number here is a function of that. Nothing is stored.
 */

/** Weighted-average cost per unit from a position's buy/sell history. */
export function averageCost(transactions: InvestmentTransaction[]): number {
  let units = 0;
  let cost = 0;
  const ordered = [...transactions].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  for (const t of ordered) {
    if (t.direction === "buy") {
      cost += t.quantity * t.price + t.fees;
      units += t.quantity;
    } else {
      // Sells retire units at the running average, leaving the average untouched.
      const avg = units > 0 ? cost / units : 0;
      const sold = Math.min(t.quantity, units);
      cost -= sold * avg;
      units -= sold;
    }
  }
  return units > 0 ? round2(cost / units) : 0;
}

/** Net units held after the full transaction history. */
export function netQuantity(transactions: InvestmentTransaction[]): number {
  return transactions.reduce(
    (sum, t) => sum + (t.direction === "buy" ? t.quantity : -t.quantity),
    0,
  );
}

export function costBasis(position: InvestmentPosition): number {
  return round2(position.quantity * position.averageCost);
}

export function marketValue(position: InvestmentPosition): number {
  return round2(position.quantity * position.currentPrice);
}

export function valuePosition(position: InvestmentPosition): PositionValuation {
  const basis = costBasis(position);
  const value = marketValue(position);
  const gain = round2(value - basis);
  return {
    positionId: position.id,
    symbol: position.symbol,
    type: position.type,
    quantity: position.quantity,
    costBasis: basis,
    marketValue: value,
    gain,
    gainPercent: basis > 0 ? round2((gain / basis) * 100) : 0,
  };
}

/**
 * Compound annual growth rate for a position, from its first buy to `now`. Returns 0 when
 * the holding is younger than a day or the basis is zero — no extrapolating from noise.
 */
export function cagr(
  position: InvestmentPosition,
  transactions: InvestmentTransaction[],
  now: Date,
): number {
  const buys = transactions
    .filter((t) => t.direction === "buy")
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const first = buys[0];
  if (!first) return 0;
  const basis = costBasis(position);
  const value = marketValue(position);
  if (basis <= 0 || value <= 0) return 0;
  const years = yearsBetween(new Date(first.occurredAt), now);
  if (years < 1 / 365) return 0;
  return round2((Math.pow(value / basis, 1 / years) - 1) * 100);
}

/** Allocation by investment type, sorted by value descending. */
export function allocation(positions: InvestmentPosition[]): AllocationSlice[] {
  const byType = new Map<InvestmentType, number>();
  for (const p of positions) {
    byType.set(p.type, (byType.get(p.type) ?? 0) + marketValue(p));
  }
  const total = [...byType.values()].reduce((a, b) => a + b, 0);
  return [...byType.entries()]
    .map(([type, value]) => ({
      type,
      value: round2(value),
      share: total > 0 ? round2(value / total) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Diversification: 1 − Herfindahl index over type shares. 0 = everything in one type,
 * approaching 1 = evenly spread. Deterministic, and not advice.
 */
export function diversification(positions: InvestmentPosition[]): number {
  const slices = allocation(positions);
  if (slices.length === 0) return 0;
  const hhi = slices.reduce((sum, s) => sum + s.share * s.share, 0);
  return round2(1 - hhi);
}

export function buildPortfolio(positions: InvestmentPosition[]): InvestmentPortfolio {
  const valued = positions.map(valuePosition);
  const basis = round2(valued.reduce((s, v) => s + v.costBasis, 0));
  const value = round2(valued.reduce((s, v) => s + v.marketValue, 0));
  const gain = round2(value - basis);
  const slices = allocation(positions);
  const over = slices.find((s) => s.share > PORTFOLIO_CONCENTRATION_LIMIT);
  return {
    costBasis: basis,
    marketValue: value,
    gain,
    gainPercent: basis > 0 ? round2((gain / basis) * 100) : 0,
    positions: valued.sort((a, b) => b.marketValue - a.marketValue),
    allocation: slices,
    unbalanced: over !== undefined,
    concentratedIn: over?.type ?? null,
  };
}
