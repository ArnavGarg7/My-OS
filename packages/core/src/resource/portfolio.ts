import { DOCUMENT_EXPIRY_SOON_DAYS, RENEWAL_SOON_DAYS } from "./constants";
import { expiringDocuments } from "./documents";
import { netWorth, type FinanceBridgeInput } from "./finance";
import { totalInventoryValue } from "./home";
import { totalCoverage, upcomingRenewals } from "./insurance";
import { buildPortfolio } from "./investments";
import { upcomingBirthdays } from "./birthdays";
import { dormantRelationships, healthReport, strongRelationships } from "./relationships";
import { expiringTravelDocuments } from "./travel";
import { totalAssetValue } from "./valuation";
import { vehicleRenewals } from "./vehicles";
import type {
  Asset,
  HomeInventoryItem,
  ImportantDocument,
  InsurancePolicy,
  InvestmentPosition,
  Relationship,
  RelationshipInteraction,
  ResourcePortfolio,
  TravelDocument,
  Vehicle,
} from "./types";

/**
 * Resource portfolio (Sprint 4.3). The whole-platform read model — net worth, coverage,
 * relationship counts and every countdown, assembled from the per-engine derivations. It is
 * ALWAYS computed and NEVER stored: there is no `net_worth` column anywhere in this
 * platform, because a stored total is a total that is quietly wrong by tomorrow.
 */

export interface PortfolioInput {
  positions: InvestmentPosition[];
  assets: Asset[];
  policies: InsurancePolicy[];
  documents: ImportantDocument[];
  travel: TravelDocument[];
  vehicles: Vehicle[];
  inventory: HomeInventoryItem[];
  relationships: Relationship[];
  interactions: RelationshipInteraction[];
  /** Supplied by Finance — this platform never derives it. */
  finance: FinanceBridgeInput;
}

export function buildResourcePortfolio(input: PortfolioInput, now: Date): ResourcePortfolio {
  const investments = buildPortfolio(input.positions);
  const assetValue = totalAssetValue(input.assets, now);
  const health = healthReport(input.relationships, input.interactions, now);

  const renewals = [
    ...upcomingRenewals(input.policies, now, RENEWAL_SOON_DAYS),
    ...expiringTravelDocuments(input.travel, now, RENEWAL_SOON_DAYS),
    ...vehicleRenewals(input.vehicles, now, RENEWAL_SOON_DAYS),
  ].sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    netWorth: netWorth({
      cashBalance: input.finance.cashBalance,
      investmentValue: investments.marketValue,
      assetValue,
      liabilities: input.finance.liabilities,
    }),
    assetValue,
    investmentValue: investments.marketValue,
    liabilities: input.finance.liabilities,
    insuranceCoverage: totalCoverage(input.policies, now),
    homeInventoryValue: totalInventoryValue(input.inventory),
    relationshipCount: input.relationships.filter((r) => !r.archived).length,
    strongRelationships: strongRelationships(health).length,
    dormantRelationships: dormantRelationships(health).length,
    upcomingRenewals: renewals,
    upcomingBirthdays: upcomingBirthdays(input.relationships, now),
    documentsExpiring: expiringDocuments(input.documents, now, DOCUMENT_EXPIRY_SOON_DAYS),
  };
}

export function emptyPortfolio(): ResourcePortfolio {
  return {
    netWorth: 0,
    assetValue: 0,
    investmentValue: 0,
    liabilities: 0,
    insuranceCoverage: 0,
    homeInventoryValue: 0,
    relationshipCount: 0,
    strongRelationships: 0,
    dormantRelationships: 0,
    upcomingRenewals: [],
    upcomingBirthdays: [],
    documentsExpiring: [],
  };
}
