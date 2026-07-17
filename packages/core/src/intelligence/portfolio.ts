import { levelForScore } from "./bands";
import { lifeBalance } from "./life-areas";
import type { IntelligenceInput, LifeBalance } from "./types";

/**
 * Intelligence portfolio (Sprint 4.4). The whole-life rollup — the "portfolio" AI seam, the
 * single object Phase 5 will read to reason about the whole person. It re-exposes the life
 * balance with a banded overall level. Derived on every read; nothing is stored.
 */

export interface LifePortfolio extends LifeBalance {
  overallLevel: ReturnType<typeof levelForScore>;
}

export function lifePortfolio(input: IntelligenceInput): LifePortfolio {
  const balance = lifeBalance(input);
  return { ...balance, overallLevel: levelForScore(balance.overall) };
}
