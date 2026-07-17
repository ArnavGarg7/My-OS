import { averageCost, netQuantity } from "./investments";
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
import type {
  AssetType,
  DocumentType,
  InsuranceType,
  InteractionType,
  InvestmentType,
  RelationshipType,
  ResourceReviewFrequency,
  TravelDocumentType,
  VehicleType,
} from "./constants";

/**
 * Resource engine (Sprint 4.3). Entity constructors with `newId` and `now` INJECTED — the
 * whole platform stays pure and testable because nothing in here calls `Date.now()` or
 * `randomUUID()` itself. Defaults are explicit so a half-filled form still produces a valid
 * row, and re-deriving a position's cost basis from its transactions lives here too.
 */

export interface EngineDeps {
  newId: () => string;
  now: () => Date;
}

export class ResourceEngine {
  constructor(private readonly deps: EngineDeps) {}

  private iso(): string {
    return this.deps.now().toISOString();
  }

  makeInvestmentAccount(input: {
    name: string;
    institution?: string;
    financeAccountId?: string | null;
    knowledgeNoteId?: string | null;
  }): InvestmentAccount {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      institution: input.institution?.trim() ?? "",
      financeAccountId: input.financeAccountId ?? null,
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makePosition(input: {
    accountId: string;
    symbol: string;
    name?: string;
    type?: InvestmentType;
    quantity?: number;
    averageCost?: number;
    currentPrice?: number;
    knowledgeNoteId?: string | null;
  }): InvestmentPosition {
    const iso = this.iso();
    const price = input.currentPrice ?? 0;
    return {
      id: this.deps.newId(),
      accountId: input.accountId,
      symbol: input.symbol.trim().toUpperCase(),
      name: input.name?.trim() ?? input.symbol.trim(),
      type: input.type ?? "stock",
      quantity: input.quantity ?? 0,
      averageCost: input.averageCost ?? 0,
      currentPrice: price,
      pricedAt: price > 0 ? iso : null,
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeInvestmentTransaction(input: {
    positionId: string;
    direction: "buy" | "sell";
    quantity: number;
    price: number;
    fees?: number;
    occurredAt?: string;
  }): InvestmentTransaction {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      positionId: input.positionId,
      direction: input.direction,
      quantity: input.quantity,
      price: input.price,
      fees: input.fees ?? 0,
      occurredAt: input.occurredAt ?? iso,
      createdAt: iso,
    };
  }

  /**
   * Re-derive a position's quantity and weighted-average cost from its full transaction
   * history. Called after every buy/sell so the stored row is a cache of the ledger rather
   * than an independently-edited number that can disagree with it.
   */
  reprice(position: InvestmentPosition, transactions: InvestmentTransaction[]): InvestmentPosition {
    const mine = transactions.filter((t) => t.positionId === position.id);
    return {
      ...position,
      quantity: netQuantity(mine),
      averageCost: averageCost(mine),
      updatedAt: this.iso(),
    };
  }

  makeAsset(input: {
    name: string;
    type?: AssetType;
    purchasePrice?: number;
    purchasedAt?: string;
    currentValue?: number | null;
    depreciationRate?: number | null;
    warrantyExpiresAt?: string | null;
    serialNumber?: string;
    location?: string;
    notes?: string;
    knowledgeNoteId?: string | null;
  }): Asset {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      type: input.type ?? "electronics",
      purchasePrice: input.purchasePrice ?? 0,
      purchasedAt: input.purchasedAt ?? iso.slice(0, 10),
      currentValue: input.currentValue ?? null,
      depreciationRate: input.depreciationRate ?? null,
      warrantyExpiresAt: input.warrantyExpiresAt ?? null,
      serialNumber: input.serialNumber?.trim() ?? "",
      location: input.location?.trim() ?? "",
      notes: input.notes ?? "",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeMaintenance(input: {
    assetId: string;
    title: string;
    dueAt: string;
    cost?: number;
    intervalDays?: number;
    notes?: string;
  }): AssetMaintenance {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      assetId: input.assetId,
      title: input.title.trim(),
      dueAt: input.dueAt,
      completedAt: null,
      cost: input.cost ?? 0,
      notes: input.notes ?? "",
      intervalDays: input.intervalDays ?? 0,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeVehicle(input: {
    name: string;
    type?: VehicleType;
    registrationNumber?: string;
    assetId?: string | null;
    odometer?: number;
    registrationExpiresAt?: string | null;
    pollutionExpiresAt?: string | null;
    insurancePolicyId?: string | null;
    notes?: string;
    knowledgeNoteId?: string | null;
  }): Vehicle {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      type: input.type ?? "car",
      registrationNumber: input.registrationNumber?.trim() ?? "",
      assetId: input.assetId ?? null,
      odometer: input.odometer ?? 0,
      registrationExpiresAt: input.registrationExpiresAt ?? null,
      pollutionExpiresAt: input.pollutionExpiresAt ?? null,
      insurancePolicyId: input.insurancePolicyId ?? null,
      notes: input.notes ?? "",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makePolicy(input: {
    name: string;
    type?: InsuranceType;
    provider?: string;
    policyNumber?: string;
    coverageAmount?: number;
    premium?: number;
    premiumIntervalMonths?: number;
    startsAt?: string;
    expiresAt: string;
    beneficiaries?: string[];
    assetId?: string | null;
    knowledgeNoteId?: string | null;
  }): InsurancePolicy {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      type: input.type ?? "health",
      provider: input.provider?.trim() ?? "",
      policyNumber: input.policyNumber?.trim() ?? "",
      coverageAmount: input.coverageAmount ?? 0,
      premium: input.premium ?? 0,
      premiumIntervalMonths: input.premiumIntervalMonths ?? 12,
      startsAt: input.startsAt ?? iso.slice(0, 10),
      expiresAt: input.expiresAt,
      beneficiaries: input.beneficiaries ?? [],
      claims: [],
      assetId: input.assetId ?? null,
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeDocument(input: {
    name: string;
    type?: DocumentType;
    documentNumber?: string;
    issuedAt?: string | null;
    expiresAt?: string | null;
    issuer?: string;
    location?: string;
    notes?: string;
    knowledgeNoteId?: string | null;
  }): ImportantDocument {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      type: input.type ?? "certificate",
      documentNumber: input.documentNumber?.trim() ?? "",
      issuedAt: input.issuedAt ?? null,
      expiresAt: input.expiresAt ?? null,
      issuer: input.issuer?.trim() ?? "",
      location: input.location?.trim() ?? "",
      notes: input.notes ?? "",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeTravelDocument(input: {
    name: string;
    type?: TravelDocumentType;
    reference?: string;
    country?: string;
    issuedAt?: string | null;
    expiresAt?: string | null;
    notes?: string;
    knowledgeNoteId?: string | null;
  }): TravelDocument {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      type: input.type ?? "passport",
      reference: input.reference?.trim() ?? "",
      country: input.country?.trim() ?? "",
      issuedAt: input.issuedAt ?? null,
      expiresAt: input.expiresAt ?? null,
      notes: input.notes ?? "",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeRelationship(input: {
    name: string;
    type?: RelationshipType;
    company?: string;
    role?: string;
    location?: string;
    birthday?: string | null;
    anniversary?: string | null;
    interests?: string[];
    notes?: string;
    nextFollowUpAt?: string | null;
    knowledgeNoteId?: string | null;
  }): Relationship {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      type: input.type ?? "friend",
      company: input.company?.trim() ?? "",
      role: input.role?.trim() ?? "",
      location: input.location?.trim() ?? "",
      birthday: input.birthday ?? null,
      anniversary: input.anniversary ?? null,
      interests: input.interests ?? [],
      notes: input.notes ?? "",
      nextFollowUpAt: input.nextFollowUpAt ?? null,
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      archived: false,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeInteraction(input: {
    relationshipId: string;
    type?: InteractionType;
    notes?: string;
    occurredAt?: string;
  }): RelationshipInteraction {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      relationshipId: input.relationshipId,
      type: input.type ?? "message",
      notes: input.notes ?? "",
      occurredAt: input.occurredAt ?? iso,
      createdAt: iso,
    };
  }

  makeEvent(input: {
    relationshipId: string;
    title: string;
    kind?: string;
    occurredAt?: string;
    notes?: string;
  }): RelationshipEvent {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      relationshipId: input.relationshipId,
      title: input.title.trim(),
      kind: input.kind ?? "conference",
      occurredAt: input.occurredAt ?? iso,
      notes: input.notes ?? "",
      createdAt: iso,
    };
  }

  makeInventoryItem(input: {
    name: string;
    room?: string;
    quantity?: number;
    unitValue?: number;
    assetId?: string | null;
    notes?: string;
    knowledgeNoteId?: string | null;
  }): HomeInventoryItem {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      room: input.room?.trim() ?? "",
      quantity: input.quantity ?? 1,
      unitValue: input.unitValue ?? 0,
      assetId: input.assetId ?? null,
      notes: input.notes ?? "",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeReview(input: {
    frequency: ResourceReviewFrequency;
    periodStart?: string;
    netWorth?: number;
    notes?: string;
    knowledgeNoteId?: string | null;
  }): ResourceReview {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      frequency: input.frequency,
      periodStart: input.periodStart ?? iso.slice(0, 10),
      netWorth: input.netWorth ?? 0,
      notes: input.notes ?? "",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      createdAt: iso,
    };
  }
}

export function createResourceEngine(deps: EngineDeps): ResourceEngine {
  return new ResourceEngine(deps);
}
