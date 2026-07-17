import { documentHealth } from "./documents";
import { countThisMonth } from "./interactions";
import { completedCount, overdue } from "./maintenance";
import type {
  Asset,
  AssetMaintenance,
  ImportantDocument,
  InsurancePolicy,
  InvestmentPosition,
  Relationship,
  RelationshipInteraction,
  ResourceStatistics,
  Vehicle,
} from "./types";

/**
 * Resource statistics (Sprint 4.3). Counts and completion rates across the platform, for
 * the dashboard's Statistics tab and the Analytics metrics. Pure aggregation — every number
 * here is `length` or a ratio of two lengths.
 */

export interface StatisticsInput {
  positions: InvestmentPosition[];
  assets: Asset[];
  vehicles: Vehicle[];
  policies: InsurancePolicy[];
  documents: ImportantDocument[];
  relationships: Relationship[];
  interactions: RelationshipInteraction[];
  maintenance: AssetMaintenance[];
}

export function buildStatistics(input: StatisticsInput, now: Date): ResourceStatistics {
  return {
    investmentCount: input.positions.length,
    assetCount: input.assets.length,
    vehicleCount: input.vehicles.length,
    policyCount: input.policies.length,
    documentCount: input.documents.length,
    relationshipCount: input.relationships.filter((r) => !r.archived).length,
    interactionsThisMonth: countThisMonth(input.interactions, now),
    maintenanceCompleted: completedCount(input.maintenance),
    maintenanceOverdue: overdue(input.maintenance, input.assets, now).length,
    documentHealth: documentHealth(input.documents, now),
  };
}

export function emptyStatistics(): ResourceStatistics {
  return {
    investmentCount: 0,
    assetCount: 0,
    vehicleCount: 0,
    policyCount: 0,
    documentCount: 0,
    relationshipCount: 0,
    interactionsThisMonth: 0,
    maintenanceCompleted: 0,
    maintenanceOverdue: 0,
    documentHealth: 100,
  };
}

/**
 * Maintenance completion rate 0–100 — of everything ever scheduled, how much got done.
 * An empty schedule is 100: nothing was owed, nothing was missed.
 */
export function maintenanceCompletionRate(items: AssetMaintenance[]): number {
  if (items.length === 0) return 100;
  return Math.round((completedCount(items) / items.length) * 100);
}
