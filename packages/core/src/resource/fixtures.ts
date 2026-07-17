import { createResourceEngine } from "./engine";
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
} from "./types";
import type { FinanceBridgeInput } from "./finance";
import type { PortfolioInput } from "./portfolio";
import type { SignalInput } from "./selectors";

/**
 * Resource test fixtures (Sprint 4.3). A FIXED clock so every countdown, streak and
 * valuation in the suite is reproducible — the whole platform is calendar maths, so a
 * moving `now` would make the tests lie.
 */

/** 2026-07-16, mid-morning. All fixture dates are positioned relative to this. */
export const FIXED_NOW = new Date("2026-07-16T10:00:00.000Z");

let counter = 0;
/** Deterministic id generator for engine tests — no randomUUID in pure code. */
export function testEngine() {
  counter = 0;
  return createResourceEngine({
    newId: () => `id-${++counter}`,
    now: () => FIXED_NOW,
  });
}

export function makeInvestmentAccount(over: Partial<InvestmentAccount> = {}): InvestmentAccount {
  return {
    id: "acct-1",
    name: "Zerodha",
    institution: "Zerodha Broking",
    financeAccountId: null,
    knowledgeNoteId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...over,
  };
}

export function makePosition(over: Partial<InvestmentPosition> = {}): InvestmentPosition {
  return {
    id: "pos-1",
    accountId: "acct-1",
    symbol: "INFY",
    name: "Infosys",
    type: "stock",
    quantity: 10,
    averageCost: 100,
    currentPrice: 150,
    pricedAt: "2026-07-15T09:00:00.000Z",
    knowledgeNoteId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-07-15T09:00:00.000Z",
    ...over,
  };
}

export function makeInvestmentTransaction(
  over: Partial<InvestmentTransaction> = {},
): InvestmentTransaction {
  return {
    id: "itx-1",
    positionId: "pos-1",
    direction: "buy",
    quantity: 10,
    price: 100,
    fees: 0,
    occurredAt: "2026-01-01T09:00:00.000Z",
    createdAt: "2026-01-01T09:00:00.000Z",
    ...over,
  };
}

export function makeAsset(over: Partial<Asset> = {}): Asset {
  return {
    id: "asset-1",
    name: "MacBook Pro",
    type: "electronics",
    purchasePrice: 200_000,
    purchasedAt: "2025-07-16",
    currentValue: null,
    depreciationRate: null,
    warrantyExpiresAt: "2027-07-16",
    serialNumber: "C02XYZ",
    location: "Desk",
    notes: "",
    knowledgeNoteId: null,
    createdAt: "2025-07-16T09:00:00.000Z",
    updatedAt: "2025-07-16T09:00:00.000Z",
    ...over,
  };
}

export function makeMaintenance(over: Partial<AssetMaintenance> = {}): AssetMaintenance {
  return {
    id: "mnt-1",
    assetId: "asset-1",
    title: "Service",
    dueAt: "2026-08-01",
    completedAt: null,
    cost: 5_000,
    notes: "",
    intervalDays: 0,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...over,
  };
}

export function makeVehicle(over: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "veh-1",
    name: "Swift",
    type: "car",
    registrationNumber: "KA01AB1234",
    assetId: null,
    odometer: 42_000,
    registrationExpiresAt: "2027-01-01",
    pollutionExpiresAt: "2026-08-01",
    insurancePolicyId: null,
    notes: "",
    knowledgeNoteId: null,
    createdAt: "2024-01-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...over,
  };
}

export function makePolicy(over: Partial<InsurancePolicy> = {}): InsurancePolicy {
  return {
    id: "pol-1",
    name: "Health Cover",
    type: "health",
    provider: "Acme Insurance",
    policyNumber: "POL123",
    coverageAmount: 1_000_000,
    premium: 12_000,
    premiumIntervalMonths: 12,
    startsAt: "2026-01-01",
    expiresAt: "2027-01-01",
    beneficiaries: [],
    claims: [],
    assetId: null,
    knowledgeNoteId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...over,
  };
}

export function makeDocument(over: Partial<ImportantDocument> = {}): ImportantDocument {
  return {
    id: "doc-1",
    name: "Passport",
    type: "passport",
    documentNumber: "P1234567",
    issuedAt: "2020-01-01",
    expiresAt: "2030-01-01",
    issuer: "Govt",
    location: "Safe",
    notes: "",
    knowledgeNoteId: null,
    createdAt: "2020-01-01T09:00:00.000Z",
    updatedAt: "2020-01-01T09:00:00.000Z",
    ...over,
  };
}

export function makeTravelDocument(over: Partial<TravelDocument> = {}): TravelDocument {
  return {
    id: "trv-1",
    name: "Schengen Visa",
    type: "visa",
    reference: "V-9988",
    country: "France",
    issuedAt: "2026-01-01",
    expiresAt: "2027-01-01",
    notes: "",
    knowledgeNoteId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...over,
  };
}

export function makeRelationship(over: Partial<Relationship> = {}): Relationship {
  return {
    id: "rel-1",
    name: "Asha Menon",
    type: "mentor",
    company: "Acme",
    role: "Principal Engineer",
    location: "Bengaluru",
    birthday: "07-20",
    anniversary: null,
    interests: ["systems", "climbing"],
    notes: "",
    nextFollowUpAt: null,
    knowledgeNoteId: null,
    archived: false,
    createdAt: "2025-01-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...over,
  };
}

export function makeInteraction(
  over: Partial<RelationshipInteraction> = {},
): RelationshipInteraction {
  return {
    id: "int-1",
    relationshipId: "rel-1",
    type: "call",
    notes: "",
    occurredAt: "2026-07-10T09:00:00.000Z",
    createdAt: "2026-07-10T09:00:00.000Z",
    ...over,
  };
}

export function makeRelationshipEvent(over: Partial<RelationshipEvent> = {}): RelationshipEvent {
  return {
    id: "evt-1",
    relationshipId: "rel-1",
    title: "SREcon",
    kind: "conference",
    occurredAt: "2026-05-01T09:00:00.000Z",
    notes: "",
    createdAt: "2026-05-01T09:00:00.000Z",
    ...over,
  };
}

export function makeInventoryItem(over: Partial<HomeInventoryItem> = {}): HomeInventoryItem {
  return {
    id: "inv-1",
    name: "Dining chairs",
    room: "Dining",
    quantity: 4,
    unitValue: 5_000,
    assetId: null,
    notes: "",
    knowledgeNoteId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...over,
  };
}

export function makeReview(over: Partial<ResourceReview> = {}): ResourceReview {
  return {
    id: "rev-1",
    frequency: "quarterly",
    periodStart: "2026-07-01",
    netWorth: 500_000,
    notes: "",
    knowledgeNoteId: null,
    createdAt: "2026-07-01T09:00:00.000Z",
    ...over,
  };
}

export function makeFinanceBridge(over: Partial<FinanceBridgeInput> = {}): FinanceBridgeInput {
  return { liabilities: 0, cashBalance: 0, ...over };
}

/** Build a series of interactions `count` days apart, ending `endDaysAgo` before FIXED_NOW. */
export function interactionSeries(
  relationshipId: string,
  count: number,
  spacingDays = 7,
  endDaysAgo = 0,
): RelationshipInteraction[] {
  const out: RelationshipInteraction[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(FIXED_NOW);
    d.setUTCDate(d.getUTCDate() - (endDaysAgo + i * spacingDays));
    out.push(
      makeInteraction({
        id: `${relationshipId}-int-${i}`,
        relationshipId,
        occurredAt: d.toISOString(),
      }),
    );
  }
  return out;
}

/** An empty PortfolioInput — spread over it to isolate one engine at a time. */
export function makePortfolioInput(over: Partial<PortfolioInput> = {}): PortfolioInput {
  return {
    positions: [],
    assets: [],
    policies: [],
    documents: [],
    travel: [],
    vehicles: [],
    inventory: [],
    relationships: [],
    interactions: [],
    finance: makeFinanceBridge(),
    ...over,
  };
}

export function makeSignalInput(over: Partial<SignalInput> = {}): SignalInput {
  return {
    ...makePortfolioInput(),
    maintenance: [],
    reviews: [],
    ...over,
  };
}
