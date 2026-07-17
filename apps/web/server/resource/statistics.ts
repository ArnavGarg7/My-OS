import "server-only";
import {
  allCorrelations,
  buildStatistics,
  maintenanceCompletionRate,
  type ResourceCorrelation,
  type ResourceStatistics,
} from "@myos/core/resource";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Resource statistics (Sprint 4.3). Counts, completion rates and correlations across the
 * platform. Pure aggregation over stored rows — nothing here is persisted, and the
 * correlations report nothing at all below the core's minimum sample count rather than a
 * number that looks meaningful and isn't.
 */

export async function statistics(db: Database, now = new Date()): Promise<ResourceStatistics> {
  const [
    positions,
    assets,
    vehicles,
    policies,
    documents,
    relationships,
    interactions,
    maintenance,
  ] = await Promise.all([
    repo.listPositions(db),
    repo.listAssets(db),
    repo.listVehicles(db),
    repo.listPolicies(db),
    repo.listDocuments(db),
    repo.listRelationships(db),
    repo.listInteractions(db),
    repo.listMaintenance(db),
  ]);
  return buildStatistics(
    { positions, assets, vehicles, policies, documents, relationships, interactions, maintenance },
    now,
  );
}

export async function correlations(db: Database, now = new Date()): Promise<ResourceCorrelation[]> {
  const [assets, maintenance] = await Promise.all([repo.listAssets(db), repo.listMaintenance(db)]);
  return allCorrelations(assets, maintenance, now);
}

export async function completionRate(db: Database): Promise<number> {
  return maintenanceCompletionRate(await repo.listMaintenance(db));
}
