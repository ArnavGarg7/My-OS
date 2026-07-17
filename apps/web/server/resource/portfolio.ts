import "server-only";
import {
  buildPortfolio,
  buildResourcePortfolio,
  type InvestmentPortfolio,
  type PortfolioInput,
  type ResourcePortfolio,
} from "@myos/core/resource";
import type { Database } from "@myos/db";
import { financeBridge } from "./bridge";
import * as repo from "./repository";

/**
 * Resource portfolio (Sprint 4.3). Loads every collection and defers to the pure core
 * derivations. Nothing here is cached or stored: net worth is recomputed on every read,
 * which is the only way it can be right.
 */

/** Load the full platform state once — every derived view reads from this. */
export async function gather(db: Database): Promise<PortfolioInput> {
  const [
    positions,
    assets,
    policies,
    documents,
    travel,
    vehicles,
    inventory,
    relationships,
    interactions,
    finance,
  ] = await Promise.all([
    repo.listPositions(db),
    repo.listAssets(db),
    repo.listPolicies(db),
    repo.listDocuments(db),
    repo.listTravelDocuments(db),
    repo.listVehicles(db),
    repo.listInventory(db),
    repo.listRelationships(db),
    repo.listInteractions(db),
    financeBridge(db),
  ]);
  return {
    positions,
    assets,
    policies,
    documents,
    travel,
    vehicles,
    inventory,
    relationships,
    interactions,
    finance,
  };
}

export async function portfolio(db: Database, now = new Date()): Promise<ResourcePortfolio> {
  return buildResourcePortfolio(await gather(db), now);
}

/** The investments-only view — allocation, gains, CAGR inputs, concentration. */
export async function investmentPortfolio(db: Database): Promise<InvestmentPortfolio> {
  return buildPortfolio(await repo.listPositions(db));
}
