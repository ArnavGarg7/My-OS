import "server-only";
import { randomUUID } from "node:crypto";
import {
  createResourceEngine,
  nextDueDate,
  searchResources,
  type Asset,
  type AssetMaintenance,
  type HomeInventoryItem,
  type ImportantDocument,
  type InsurancePolicy,
  type InvestmentAccount,
  type InvestmentPosition,
  type InvestmentTransaction,
  type Relationship,
  type RelationshipEvent,
  type RelationshipInteraction,
  type ResourceReview,
  type SearchHit,
  type TravelDocument,
  type Vehicle,
} from "@myos/core/resource";
import type { Database } from "@myos/db";
import { portfolio } from "./portfolio";
import * as repo from "./repository";

/**
 * Resource service (Sprint 4.3). Orchestrates the pure engine + persistence. The engine's
 * clock and id generator are injected here — this is the only file in the platform that
 * knows about `randomUUID` or the real `Date`, which is what keeps the core testable.
 */

const engine = createResourceEngine({ newId: () => randomUUID(), now: () => new Date() });

/* ── Investments ────────────────────────────────────────────────────────── */

export async function listInvestmentAccounts(db: Database): Promise<InvestmentAccount[]> {
  return repo.listInvestmentAccounts(db);
}

export async function createInvestmentAccount(
  db: Database,
  input: { name: string } & Partial<InvestmentAccount>,
): Promise<InvestmentAccount> {
  return repo.insertInvestmentAccount(db, engine.makeInvestmentAccount(input));
}

export async function listPositions(db: Database): Promise<InvestmentPosition[]> {
  return repo.listPositions(db);
}

export async function createPosition(
  db: Database,
  input: { accountId: string; symbol: string } & Partial<InvestmentPosition>,
): Promise<InvestmentPosition> {
  return repo.insertPosition(db, engine.makePosition(input));
}

export async function updatePosition(
  db: Database,
  id: string,
  patch: Partial<InvestmentPosition>,
): Promise<InvestmentPosition | null> {
  return repo.updatePositionRow(db, id, patch);
}

/**
 * A price update stamps `pricedAt` so the UI can show how stale a valuation is. Prices are
 * user-entered; there is no feed to fall back on, so knowing the age of the number matters.
 */
export async function updatePrice(
  db: Database,
  id: string,
  currentPrice: number,
): Promise<InvestmentPosition | null> {
  return repo.updatePositionRow(db, id, {
    currentPrice,
    pricedAt: new Date().toISOString(),
  });
}

export async function deletePosition(db: Database, id: string): Promise<{ id: string }> {
  await repo.deletePosition(db, id);
  return { id };
}

export async function listInvestmentTransactions(db: Database): Promise<InvestmentTransaction[]> {
  return repo.listInvestmentTransactions(db);
}

/**
 * Record a buy/sell, then RE-DERIVE the position's quantity and average cost from its full
 * ledger. The stored row is a cache of the transactions, never an independently-edited
 * number — that invariant is what stops a position from quietly disagreeing with its own
 * history.
 */
export async function recordInvestmentTransaction(
  db: Database,
  input: {
    positionId: string;
    direction: "buy" | "sell";
    quantity: number;
    price: number;
    fees?: number;
    occurredAt?: string;
  },
): Promise<InvestmentPosition | null> {
  await repo.insertInvestmentTransaction(db, engine.makeInvestmentTransaction(input));
  const [positions, transactions] = await Promise.all([
    repo.listPositions(db),
    repo.listInvestmentTransactions(db),
  ]);
  const position = positions.find((p) => p.id === input.positionId);
  if (!position) return null;
  const repriced = engine.reprice(position, transactions);
  return repo.updatePositionRow(db, position.id, {
    quantity: repriced.quantity,
    averageCost: repriced.averageCost,
  });
}

/* ── Assets ─────────────────────────────────────────────────────────────── */

export async function listAssets(db: Database): Promise<Asset[]> {
  return repo.listAssets(db);
}

export async function createAsset(
  db: Database,
  input: { name: string } & Partial<Asset>,
): Promise<Asset> {
  return repo.insertAsset(db, engine.makeAsset(input));
}

export async function updateAsset(
  db: Database,
  id: string,
  patch: Partial<Asset>,
): Promise<Asset | null> {
  return repo.updateAssetRow(db, id, patch);
}

export async function deleteAsset(db: Database, id: string): Promise<{ id: string }> {
  await repo.deleteAsset(db, id);
  return { id };
}

/* ── Maintenance ────────────────────────────────────────────────────────── */

export async function listMaintenance(db: Database): Promise<AssetMaintenance[]> {
  return repo.listMaintenance(db);
}

export async function createMaintenance(
  db: Database,
  input: { assetId: string; title: string; dueAt: string } & Partial<AssetMaintenance>,
): Promise<AssetMaintenance> {
  return repo.insertMaintenance(db, engine.makeMaintenance(input));
}

export async function updateMaintenance(
  db: Database,
  id: string,
  patch: Partial<AssetMaintenance>,
): Promise<AssetMaintenance | null> {
  return repo.updateMaintenanceRow(db, id, patch);
}

/**
 * Complete a maintenance item. A recurring item spawns its next occurrence at the interval
 * — the completed row stays as history rather than being mutated forward, so the schedule
 * and the record of what was actually done never overwrite each other.
 */
export async function completeMaintenance(
  db: Database,
  id: string,
  cost?: number,
): Promise<AssetMaintenance | null> {
  const items = await repo.listMaintenance(db);
  const item = items.find((i) => i.id === id);
  if (!item) return null;

  const now = new Date();
  const completed = await repo.updateMaintenanceRow(db, id, {
    completedAt: now.toISOString(),
    ...(cost !== undefined ? { cost } : {}),
  });

  const next = nextDueDate(item, now);
  if (next) {
    await repo.insertMaintenance(
      db,
      engine.makeMaintenance({
        assetId: item.assetId,
        title: item.title,
        dueAt: next,
        cost: item.cost,
        intervalDays: item.intervalDays,
        notes: item.notes,
      }),
    );
  }
  return completed;
}

/* ── Vehicles ───────────────────────────────────────────────────────────── */

export async function listVehicles(db: Database): Promise<Vehicle[]> {
  return repo.listVehicles(db);
}

export async function createVehicle(
  db: Database,
  input: { name: string } & Partial<Vehicle>,
): Promise<Vehicle> {
  return repo.insertVehicle(db, engine.makeVehicle(input));
}

export async function updateVehicle(
  db: Database,
  id: string,
  patch: Partial<Vehicle>,
): Promise<Vehicle | null> {
  return repo.updateVehicleRow(db, id, patch);
}

/* ── Insurance ──────────────────────────────────────────────────────────── */

export async function listPolicies(db: Database): Promise<InsurancePolicy[]> {
  return repo.listPolicies(db);
}

export async function createPolicy(
  db: Database,
  input: { name: string; expiresAt: string } & Partial<InsurancePolicy>,
): Promise<InsurancePolicy> {
  return repo.insertPolicy(db, engine.makePolicy(input));
}

export async function updatePolicy(
  db: Database,
  id: string,
  patch: Partial<InsurancePolicy>,
): Promise<InsurancePolicy | null> {
  return repo.updatePolicyRow(db, id, patch);
}

/** Claims are append-only history — the platform records, it does not adjudicate. */
export async function addClaim(
  db: Database,
  id: string,
  claim: string,
): Promise<InsurancePolicy | null> {
  const policies = await repo.listPolicies(db);
  const policy = policies.find((p) => p.id === id);
  if (!policy) return null;
  return repo.updatePolicyRow(db, id, { claims: [...policy.claims, claim] });
}

/* ── Documents ──────────────────────────────────────────────────────────── */

export async function listDocuments(db: Database): Promise<ImportantDocument[]> {
  return repo.listDocuments(db);
}

export async function createDocument(
  db: Database,
  input: { name: string } & Partial<ImportantDocument>,
): Promise<ImportantDocument> {
  return repo.insertDocument(db, engine.makeDocument(input));
}

export async function updateDocument(
  db: Database,
  id: string,
  patch: Partial<ImportantDocument>,
): Promise<ImportantDocument | null> {
  return repo.updateDocumentRow(db, id, patch);
}

/** Renewing pushes the expiry out in place; it does not create a duplicate row. */
export async function renewDocument(
  db: Database,
  id: string,
  expiresAt: string,
): Promise<ImportantDocument | null> {
  return repo.updateDocumentRow(db, id, { expiresAt });
}

export async function listTravelDocuments(db: Database): Promise<TravelDocument[]> {
  return repo.listTravelDocuments(db);
}

export async function createTravelDocument(
  db: Database,
  input: { name: string } & Partial<TravelDocument>,
): Promise<TravelDocument> {
  return repo.insertTravelDocument(db, engine.makeTravelDocument(input));
}

export async function updateTravelDocument(
  db: Database,
  id: string,
  patch: Partial<TravelDocument>,
): Promise<TravelDocument | null> {
  return repo.updateTravelDocumentRow(db, id, patch);
}

/* ── Relationships ──────────────────────────────────────────────────────── */

export async function listRelationships(db: Database): Promise<Relationship[]> {
  return repo.listRelationships(db);
}

export async function createRelationship(
  db: Database,
  input: { name: string } & Partial<Relationship>,
): Promise<Relationship> {
  return repo.insertRelationship(db, engine.makeRelationship(input));
}

export async function updateRelationship(
  db: Database,
  id: string,
  patch: Partial<Relationship>,
): Promise<Relationship | null> {
  return repo.updateRelationshipRow(db, id, patch);
}

export async function setFollowUp(
  db: Database,
  id: string,
  nextFollowUpAt: string | null,
): Promise<Relationship | null> {
  return repo.updateRelationshipRow(db, id, { nextFollowUpAt });
}

export async function listInteractions(db: Database): Promise<RelationshipInteraction[]> {
  return repo.listInteractions(db);
}

export async function logInteraction(
  db: Database,
  input: { relationshipId: string } & Partial<RelationshipInteraction>,
): Promise<RelationshipInteraction> {
  return repo.insertInteraction(db, engine.makeInteraction(input));
}

export async function listRelationshipEvents(db: Database): Promise<RelationshipEvent[]> {
  return repo.listRelationshipEvents(db);
}

export async function logRelationshipEvent(
  db: Database,
  input: { relationshipId: string; title: string } & Partial<RelationshipEvent>,
): Promise<RelationshipEvent> {
  return repo.insertRelationshipEvent(db, engine.makeEvent(input));
}

/* ── Home ───────────────────────────────────────────────────────────────── */

export async function listInventory(db: Database): Promise<HomeInventoryItem[]> {
  return repo.listInventory(db);
}

export async function createInventoryItem(
  db: Database,
  input: { name: string } & Partial<HomeInventoryItem>,
): Promise<HomeInventoryItem> {
  return repo.insertInventoryItem(db, engine.makeInventoryItem(input));
}

export async function updateInventoryItem(
  db: Database,
  id: string,
  patch: Partial<HomeInventoryItem>,
): Promise<HomeInventoryItem | null> {
  return repo.updateInventoryRow(db, id, patch);
}

export async function deleteInventoryItem(db: Database, id: string): Promise<{ id: string }> {
  await repo.deleteInventoryItem(db, id);
  return { id };
}

/* ── Reviews ────────────────────────────────────────────────────────────── */

export async function listReviews(db: Database): Promise<ResourceReview[]> {
  return repo.listReviews(db);
}

/**
 * A review snapshots the net worth derived AT REVIEW TIME. The stored number is history —
 * a record of what things were worth on that date — and is never read back as the current
 * total, which is always recomputed.
 */
export async function createReview(
  db: Database,
  input: { frequency: ResourceReview["frequency"] } & Partial<ResourceReview>,
): Promise<ResourceReview> {
  const p = await portfolio(db);
  return repo.insertReview(db, engine.makeReview({ ...input, netWorth: p.netWorth }));
}

/* ── Search ─────────────────────────────────────────────────────────────── */

export async function search(db: Database, query: string, limit?: number): Promise<SearchHit[]> {
  const [assets, positions, relationships, documents, policies, vehicles, travel] =
    await Promise.all([
      repo.listAssets(db),
      repo.listPositions(db),
      repo.listRelationships(db),
      repo.listDocuments(db),
      repo.listPolicies(db),
      repo.listVehicles(db),
      repo.listTravelDocuments(db),
    ]);
  return searchResources(
    { assets, positions, relationships, documents, policies, vehicles, travel },
    query,
    limit,
  );
}
