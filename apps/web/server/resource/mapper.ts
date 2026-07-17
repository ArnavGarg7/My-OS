import "server-only";
import type {
  Asset,
  AssetMaintenance,
  HomeInventoryItem,
  ImportantDocument,
  InsurancePolicy,
  InvestmentAccount,
  InvestmentPosition,
  InvestmentTransaction,
  Relationship,
  RelationshipEvent,
  RelationshipInteraction,
  ResourceReview,
  TravelDocument,
  Vehicle,
} from "@myos/core/resource";
import type {
  AssetMaintenanceRow,
  AssetRow,
  HomeInventoryRow,
  ImportantDocumentRow,
  InsurancePolicyRow,
  InvestmentAccountRow,
  InvestmentPositionRow,
  InvestmentTransactionRow,
  RelationshipEventRow,
  RelationshipInteractionRow,
  RelationshipRow,
  ResourceReviewRow,
  TravelDocumentRow,
  VehicleRow,
} from "@myos/db/schema";

/**
 * Resource mappers (Sprint 4.3). DB rows → pure core types. Timestamps become ISO strings
 * and dates stay YYYY-MM-DD, so the core never touches a `Date` it did not construct. No
 * derived value is mapped here — there is nothing to map, because none are stored.
 */

function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export function investmentAccountRowTo(row: InvestmentAccountRow): InvestmentAccount {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    financeAccountId: row.financeAccountId,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function positionRowTo(row: InvestmentPositionRow): InvestmentPosition {
  return {
    id: row.id,
    accountId: row.accountId,
    symbol: row.symbol,
    name: row.name,
    type: row.type,
    quantity: row.quantity,
    averageCost: row.averageCost,
    currentPrice: row.currentPrice,
    pricedAt: iso(row.pricedAt),
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function investmentTransactionRowTo(row: InvestmentTransactionRow): InvestmentTransaction {
  return {
    id: row.id,
    positionId: row.positionId,
    direction: row.direction === "sell" ? "sell" : "buy",
    quantity: row.quantity,
    price: row.price,
    fees: row.fees,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function assetRowTo(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    purchasePrice: row.purchasePrice,
    purchasedAt: row.purchasedAt,
    currentValue: row.currentValue,
    depreciationRate: row.depreciationRate,
    warrantyExpiresAt: row.warrantyExpiresAt,
    serialNumber: row.serialNumber,
    location: row.location,
    notes: row.notes,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function maintenanceRowTo(row: AssetMaintenanceRow): AssetMaintenance {
  return {
    id: row.id,
    assetId: row.assetId,
    title: row.title,
    dueAt: row.dueAt,
    completedAt: iso(row.completedAt),
    cost: row.cost,
    notes: row.notes,
    intervalDays: row.intervalDays,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function vehicleRowTo(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    registrationNumber: row.registrationNumber,
    assetId: row.assetId,
    odometer: row.odometer,
    registrationExpiresAt: row.registrationExpiresAt,
    pollutionExpiresAt: row.pollutionExpiresAt,
    insurancePolicyId: row.insurancePolicyId,
    notes: row.notes,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function policyRowTo(row: InsurancePolicyRow): InsurancePolicy {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    provider: row.provider,
    policyNumber: row.policyNumber,
    coverageAmount: row.coverageAmount,
    premium: row.premium,
    premiumIntervalMonths: row.premiumIntervalMonths,
    startsAt: row.startsAt,
    expiresAt: row.expiresAt,
    beneficiaries: row.beneficiaries,
    claims: row.claims,
    assetId: row.assetId,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function documentRowTo(row: ImportantDocumentRow): ImportantDocument {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    documentNumber: row.documentNumber,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    issuer: row.issuer,
    location: row.location,
    notes: row.notes,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function travelDocumentRowTo(row: TravelDocumentRow): TravelDocument {
  return {
    id: row.id,
    name: row.name,
    type: row.type as TravelDocument["type"],
    reference: row.reference,
    country: row.country,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    notes: row.notes,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function relationshipRowTo(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    company: row.company,
    role: row.role,
    location: row.location,
    birthday: row.birthday,
    anniversary: row.anniversary,
    interests: row.interests,
    notes: row.notes,
    nextFollowUpAt: row.nextFollowUpAt,
    knowledgeNoteId: row.knowledgeNoteId,
    archived: row.archived,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function interactionRowTo(row: RelationshipInteractionRow): RelationshipInteraction {
  return {
    id: row.id,
    relationshipId: row.relationshipId,
    type: row.type,
    notes: row.notes,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function relationshipEventRowTo(row: RelationshipEventRow): RelationshipEvent {
  return {
    id: row.id,
    relationshipId: row.relationshipId,
    title: row.title,
    kind: row.kind,
    occurredAt: row.occurredAt.toISOString(),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

export function inventoryRowTo(row: HomeInventoryRow): HomeInventoryItem {
  return {
    id: row.id,
    name: row.name,
    room: row.room,
    quantity: row.quantity,
    unitValue: row.unitValue,
    assetId: row.assetId,
    notes: row.notes,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function reviewRowTo(row: ResourceReviewRow): ResourceReview {
  return {
    id: row.id,
    frequency: row.frequency as ResourceReview["frequency"],
    periodStart: row.periodStart,
    netWorth: row.netWorth,
    notes: row.notes,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
  };
}
