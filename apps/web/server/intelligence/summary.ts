import "server-only";
import {
  buildSummary,
  computeSignals,
  lifePortfolio,
  type IntelligenceSignals,
  type IntelligenceSummary,
  type LifePortfolio,
} from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import { composeInput } from "./composer";

/**
 * Server summary + signals (Sprint 4.4). The AI seams the rest of My OS reads: summary() for
 * Morning/Tomorrow/status bar, signals() for the Decision engine, portfolio() for the
 * whole-life rollup. Each defers entirely to the pure core over the composed input.
 */
export async function summary(db: Database, tz: string): Promise<IntelligenceSummary> {
  return buildSummary(await composeInput(db, tz));
}

export async function signals(db: Database, tz: string): Promise<IntelligenceSignals> {
  return computeSignals(await composeInput(db, tz));
}

export async function portfolio(db: Database, tz: string): Promise<LifePortfolio> {
  return lifePortfolio(await composeInput(db, tz));
}
