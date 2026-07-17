import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  assetMaintenance,
  assets,
  homeInventory,
  importantDocuments,
  insurancePolicies,
  investmentAccounts,
  investmentPositions,
  investmentTransactions,
  relationshipEvents,
  relationshipInteractions,
  relationships,
  resourceReviews,
  travelDocuments,
  vehicles,
} from "@myos/db/schema";
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
import * as m from "./mapper";

/**
 * Resource persistence (Sprint 4.3). CRUD over the resource tables and nothing else — every
 * derived view (net worth, allocation, depreciation, relationship strength, countdowns) is
 * computed by core from these rows on read. Finance's own tables are never written here.
 */

/* ── Investments ────────────────────────────────────────────────────────── */

export async function listInvestmentAccounts(db: Database): Promise<InvestmentAccount[]> {
  const rows = await db.select().from(investmentAccounts).orderBy(investmentAccounts.name);
  return rows.map(m.investmentAccountRowTo);
}

export async function insertInvestmentAccount(
  db: Database,
  account: InvestmentAccount,
): Promise<InvestmentAccount> {
  const [row] = await db
    .insert(investmentAccounts)
    .values({
      name: account.name,
      institution: account.institution,
      financeAccountId: account.financeAccountId,
      knowledgeNoteId: account.knowledgeNoteId,
    })
    .returning();
  return m.investmentAccountRowTo(row!);
}

export async function listPositions(db: Database): Promise<InvestmentPosition[]> {
  const rows = await db.select().from(investmentPositions).orderBy(investmentPositions.symbol);
  return rows.map(m.positionRowTo);
}

export async function insertPosition(
  db: Database,
  position: InvestmentPosition,
): Promise<InvestmentPosition> {
  const [row] = await db
    .insert(investmentPositions)
    .values({
      accountId: position.accountId,
      symbol: position.symbol,
      name: position.name,
      type: position.type,
      quantity: position.quantity,
      averageCost: position.averageCost,
      currentPrice: position.currentPrice,
      pricedAt: position.pricedAt ? new Date(position.pricedAt) : null,
      knowledgeNoteId: position.knowledgeNoteId,
    })
    .returning();
  return m.positionRowTo(row!);
}

export async function updatePositionRow(
  db: Database,
  id: string,
  patch: Partial<InvestmentPosition>,
): Promise<InvestmentPosition | null> {
  const [row] = await db
    .update(investmentPositions)
    .set({
      ...(patch.symbol !== undefined ? { symbol: patch.symbol } : {}),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
      ...(patch.averageCost !== undefined ? { averageCost: patch.averageCost } : {}),
      ...(patch.currentPrice !== undefined ? { currentPrice: patch.currentPrice } : {}),
      ...(patch.pricedAt !== undefined
        ? { pricedAt: patch.pricedAt ? new Date(patch.pricedAt) : null }
        : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(investmentPositions.id, id))
    .returning();
  return row ? m.positionRowTo(row) : null;
}

export async function deletePosition(db: Database, id: string): Promise<void> {
  await db.delete(investmentPositions).where(eq(investmentPositions.id, id));
}

export async function listInvestmentTransactions(db: Database): Promise<InvestmentTransaction[]> {
  const rows = await db
    .select()
    .from(investmentTransactions)
    .orderBy(desc(investmentTransactions.occurredAt));
  return rows.map(m.investmentTransactionRowTo);
}

export async function insertInvestmentTransaction(
  db: Database,
  tx: InvestmentTransaction,
): Promise<InvestmentTransaction> {
  const [row] = await db
    .insert(investmentTransactions)
    .values({
      positionId: tx.positionId,
      direction: tx.direction,
      quantity: tx.quantity,
      price: tx.price,
      fees: tx.fees,
      occurredAt: new Date(tx.occurredAt),
    })
    .returning();
  return m.investmentTransactionRowTo(row!);
}

/* ── Assets ─────────────────────────────────────────────────────────────── */

export async function listAssets(db: Database): Promise<Asset[]> {
  const rows = await db.select().from(assets).orderBy(desc(assets.createdAt));
  return rows.map(m.assetRowTo);
}

export async function insertAsset(db: Database, asset: Asset): Promise<Asset> {
  const [row] = await db
    .insert(assets)
    .values({
      name: asset.name,
      type: asset.type,
      purchasePrice: asset.purchasePrice,
      purchasedAt: asset.purchasedAt,
      currentValue: asset.currentValue,
      depreciationRate: asset.depreciationRate,
      warrantyExpiresAt: asset.warrantyExpiresAt,
      serialNumber: asset.serialNumber,
      location: asset.location,
      notes: asset.notes,
      knowledgeNoteId: asset.knowledgeNoteId,
    })
    .returning();
  return m.assetRowTo(row!);
}

export async function updateAssetRow(
  db: Database,
  id: string,
  patch: Partial<Asset>,
): Promise<Asset | null> {
  const [row] = await db
    .update(assets)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.purchasePrice !== undefined ? { purchasePrice: patch.purchasePrice } : {}),
      ...(patch.purchasedAt !== undefined ? { purchasedAt: patch.purchasedAt } : {}),
      ...(patch.currentValue !== undefined ? { currentValue: patch.currentValue } : {}),
      ...(patch.depreciationRate !== undefined ? { depreciationRate: patch.depreciationRate } : {}),
      ...(patch.warrantyExpiresAt !== undefined
        ? { warrantyExpiresAt: patch.warrantyExpiresAt }
        : {}),
      ...(patch.serialNumber !== undefined ? { serialNumber: patch.serialNumber } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(assets.id, id))
    .returning();
  return row ? m.assetRowTo(row) : null;
}

export async function deleteAsset(db: Database, id: string): Promise<void> {
  await db.delete(assets).where(eq(assets.id, id));
}

/* ── Maintenance ────────────────────────────────────────────────────────── */

export async function listMaintenance(db: Database): Promise<AssetMaintenance[]> {
  const rows = await db.select().from(assetMaintenance).orderBy(assetMaintenance.dueAt);
  return rows.map(m.maintenanceRowTo);
}

export async function insertMaintenance(
  db: Database,
  item: AssetMaintenance,
): Promise<AssetMaintenance> {
  const [row] = await db
    .insert(assetMaintenance)
    .values({
      assetId: item.assetId,
      title: item.title,
      dueAt: item.dueAt,
      cost: item.cost,
      notes: item.notes,
      intervalDays: item.intervalDays,
    })
    .returning();
  return m.maintenanceRowTo(row!);
}

export async function updateMaintenanceRow(
  db: Database,
  id: string,
  patch: Partial<AssetMaintenance>,
): Promise<AssetMaintenance | null> {
  const [row] = await db
    .update(assetMaintenance)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.dueAt !== undefined ? { dueAt: patch.dueAt } : {}),
      ...(patch.completedAt !== undefined
        ? { completedAt: patch.completedAt ? new Date(patch.completedAt) : null }
        : {}),
      ...(patch.cost !== undefined ? { cost: patch.cost } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.intervalDays !== undefined ? { intervalDays: patch.intervalDays } : {}),
      updatedAt: new Date(),
    })
    .where(eq(assetMaintenance.id, id))
    .returning();
  return row ? m.maintenanceRowTo(row) : null;
}

/* ── Vehicles ───────────────────────────────────────────────────────────── */

export async function listVehicles(db: Database): Promise<Vehicle[]> {
  const rows = await db.select().from(vehicles).orderBy(vehicles.name);
  return rows.map(m.vehicleRowTo);
}

export async function insertVehicle(db: Database, vehicle: Vehicle): Promise<Vehicle> {
  const [row] = await db
    .insert(vehicles)
    .values({
      name: vehicle.name,
      type: vehicle.type,
      registrationNumber: vehicle.registrationNumber,
      assetId: vehicle.assetId,
      odometer: vehicle.odometer,
      registrationExpiresAt: vehicle.registrationExpiresAt,
      pollutionExpiresAt: vehicle.pollutionExpiresAt,
      insurancePolicyId: vehicle.insurancePolicyId,
      notes: vehicle.notes,
      knowledgeNoteId: vehicle.knowledgeNoteId,
    })
    .returning();
  return m.vehicleRowTo(row!);
}

export async function updateVehicleRow(
  db: Database,
  id: string,
  patch: Partial<Vehicle>,
): Promise<Vehicle | null> {
  const [row] = await db
    .update(vehicles)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.registrationNumber !== undefined
        ? { registrationNumber: patch.registrationNumber }
        : {}),
      ...(patch.assetId !== undefined ? { assetId: patch.assetId } : {}),
      ...(patch.odometer !== undefined ? { odometer: patch.odometer } : {}),
      ...(patch.registrationExpiresAt !== undefined
        ? { registrationExpiresAt: patch.registrationExpiresAt }
        : {}),
      ...(patch.pollutionExpiresAt !== undefined
        ? { pollutionExpiresAt: patch.pollutionExpiresAt }
        : {}),
      ...(patch.insurancePolicyId !== undefined
        ? { insurancePolicyId: patch.insurancePolicyId }
        : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
    .returning();
  return row ? m.vehicleRowTo(row) : null;
}

/* ── Insurance ──────────────────────────────────────────────────────────── */

export async function listPolicies(db: Database): Promise<InsurancePolicy[]> {
  const rows = await db.select().from(insurancePolicies).orderBy(insurancePolicies.expiresAt);
  return rows.map(m.policyRowTo);
}

export async function insertPolicy(
  db: Database,
  policy: InsurancePolicy,
): Promise<InsurancePolicy> {
  const [row] = await db
    .insert(insurancePolicies)
    .values({
      name: policy.name,
      type: policy.type,
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      coverageAmount: policy.coverageAmount,
      premium: policy.premium,
      premiumIntervalMonths: policy.premiumIntervalMonths,
      startsAt: policy.startsAt,
      expiresAt: policy.expiresAt,
      beneficiaries: policy.beneficiaries,
      claims: policy.claims,
      assetId: policy.assetId,
      knowledgeNoteId: policy.knowledgeNoteId,
    })
    .returning();
  return m.policyRowTo(row!);
}

export async function updatePolicyRow(
  db: Database,
  id: string,
  patch: Partial<InsurancePolicy>,
): Promise<InsurancePolicy | null> {
  const [row] = await db
    .update(insurancePolicies)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.provider !== undefined ? { provider: patch.provider } : {}),
      ...(patch.policyNumber !== undefined ? { policyNumber: patch.policyNumber } : {}),
      ...(patch.coverageAmount !== undefined ? { coverageAmount: patch.coverageAmount } : {}),
      ...(patch.premium !== undefined ? { premium: patch.premium } : {}),
      ...(patch.premiumIntervalMonths !== undefined
        ? { premiumIntervalMonths: patch.premiumIntervalMonths }
        : {}),
      ...(patch.startsAt !== undefined ? { startsAt: patch.startsAt } : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
      ...(patch.beneficiaries !== undefined ? { beneficiaries: patch.beneficiaries } : {}),
      ...(patch.claims !== undefined ? { claims: patch.claims } : {}),
      ...(patch.assetId !== undefined ? { assetId: patch.assetId } : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(insurancePolicies.id, id))
    .returning();
  return row ? m.policyRowTo(row) : null;
}

/* ── Documents ──────────────────────────────────────────────────────────── */

export async function listDocuments(db: Database): Promise<ImportantDocument[]> {
  const rows = await db.select().from(importantDocuments).orderBy(importantDocuments.name);
  return rows.map(m.documentRowTo);
}

export async function insertDocument(
  db: Database,
  doc: ImportantDocument,
): Promise<ImportantDocument> {
  const [row] = await db
    .insert(importantDocuments)
    .values({
      name: doc.name,
      type: doc.type,
      documentNumber: doc.documentNumber,
      issuedAt: doc.issuedAt,
      expiresAt: doc.expiresAt,
      issuer: doc.issuer,
      location: doc.location,
      notes: doc.notes,
      knowledgeNoteId: doc.knowledgeNoteId,
    })
    .returning();
  return m.documentRowTo(row!);
}

export async function updateDocumentRow(
  db: Database,
  id: string,
  patch: Partial<ImportantDocument>,
): Promise<ImportantDocument | null> {
  const [row] = await db
    .update(importantDocuments)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.documentNumber !== undefined ? { documentNumber: patch.documentNumber } : {}),
      ...(patch.issuedAt !== undefined ? { issuedAt: patch.issuedAt } : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
      ...(patch.issuer !== undefined ? { issuer: patch.issuer } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(importantDocuments.id, id))
    .returning();
  return row ? m.documentRowTo(row) : null;
}

export async function listTravelDocuments(db: Database): Promise<TravelDocument[]> {
  const rows = await db.select().from(travelDocuments).orderBy(travelDocuments.name);
  return rows.map(m.travelDocumentRowTo);
}

export async function insertTravelDocument(
  db: Database,
  doc: TravelDocument,
): Promise<TravelDocument> {
  const [row] = await db
    .insert(travelDocuments)
    .values({
      name: doc.name,
      type: doc.type,
      reference: doc.reference,
      country: doc.country,
      issuedAt: doc.issuedAt,
      expiresAt: doc.expiresAt,
      notes: doc.notes,
      knowledgeNoteId: doc.knowledgeNoteId,
    })
    .returning();
  return m.travelDocumentRowTo(row!);
}

export async function updateTravelDocumentRow(
  db: Database,
  id: string,
  patch: Partial<TravelDocument>,
): Promise<TravelDocument | null> {
  const [row] = await db
    .update(travelDocuments)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.reference !== undefined ? { reference: patch.reference } : {}),
      ...(patch.country !== undefined ? { country: patch.country } : {}),
      ...(patch.issuedAt !== undefined ? { issuedAt: patch.issuedAt } : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(travelDocuments.id, id))
    .returning();
  return row ? m.travelDocumentRowTo(row) : null;
}

/* ── Relationships ──────────────────────────────────────────────────────── */

export async function listRelationships(db: Database): Promise<Relationship[]> {
  const rows = await db.select().from(relationships).orderBy(relationships.name);
  return rows.map(m.relationshipRowTo);
}

export async function insertRelationship(
  db: Database,
  relationship: Relationship,
): Promise<Relationship> {
  const [row] = await db
    .insert(relationships)
    .values({
      name: relationship.name,
      type: relationship.type,
      company: relationship.company,
      role: relationship.role,
      location: relationship.location,
      birthday: relationship.birthday,
      anniversary: relationship.anniversary,
      interests: relationship.interests,
      notes: relationship.notes,
      nextFollowUpAt: relationship.nextFollowUpAt,
      knowledgeNoteId: relationship.knowledgeNoteId,
    })
    .returning();
  return m.relationshipRowTo(row!);
}

export async function updateRelationshipRow(
  db: Database,
  id: string,
  patch: Partial<Relationship>,
): Promise<Relationship | null> {
  const [row] = await db
    .update(relationships)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.company !== undefined ? { company: patch.company } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.birthday !== undefined ? { birthday: patch.birthday } : {}),
      ...(patch.anniversary !== undefined ? { anniversary: patch.anniversary } : {}),
      ...(patch.interests !== undefined ? { interests: patch.interests } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.nextFollowUpAt !== undefined ? { nextFollowUpAt: patch.nextFollowUpAt } : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      ...(patch.archived !== undefined ? { archived: patch.archived } : {}),
      updatedAt: new Date(),
    })
    .where(eq(relationships.id, id))
    .returning();
  return row ? m.relationshipRowTo(row) : null;
}

export async function listInteractions(db: Database): Promise<RelationshipInteraction[]> {
  const rows = await db
    .select()
    .from(relationshipInteractions)
    .orderBy(desc(relationshipInteractions.occurredAt));
  return rows.map(m.interactionRowTo);
}

export async function insertInteraction(
  db: Database,
  interaction: RelationshipInteraction,
): Promise<RelationshipInteraction> {
  const [row] = await db
    .insert(relationshipInteractions)
    .values({
      relationshipId: interaction.relationshipId,
      type: interaction.type,
      notes: interaction.notes,
      occurredAt: new Date(interaction.occurredAt),
    })
    .returning();
  return m.interactionRowTo(row!);
}

export async function listRelationshipEvents(db: Database): Promise<RelationshipEvent[]> {
  const rows = await db
    .select()
    .from(relationshipEvents)
    .orderBy(desc(relationshipEvents.occurredAt));
  return rows.map(m.relationshipEventRowTo);
}

export async function insertRelationshipEvent(
  db: Database,
  event: RelationshipEvent,
): Promise<RelationshipEvent> {
  const [row] = await db
    .insert(relationshipEvents)
    .values({
      relationshipId: event.relationshipId,
      title: event.title,
      kind: event.kind,
      occurredAt: new Date(event.occurredAt),
      notes: event.notes,
    })
    .returning();
  return m.relationshipEventRowTo(row!);
}

/* ── Home + reviews ─────────────────────────────────────────────────────── */

export async function listInventory(db: Database): Promise<HomeInventoryItem[]> {
  const rows = await db.select().from(homeInventory).orderBy(homeInventory.room);
  return rows.map(m.inventoryRowTo);
}

export async function insertInventoryItem(
  db: Database,
  item: HomeInventoryItem,
): Promise<HomeInventoryItem> {
  const [row] = await db
    .insert(homeInventory)
    .values({
      name: item.name,
      room: item.room,
      quantity: item.quantity,
      unitValue: item.unitValue,
      assetId: item.assetId,
      notes: item.notes,
      knowledgeNoteId: item.knowledgeNoteId,
    })
    .returning();
  return m.inventoryRowTo(row!);
}

export async function updateInventoryRow(
  db: Database,
  id: string,
  patch: Partial<HomeInventoryItem>,
): Promise<HomeInventoryItem | null> {
  const [row] = await db
    .update(homeInventory)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.room !== undefined ? { room: patch.room } : {}),
      ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
      ...(patch.unitValue !== undefined ? { unitValue: patch.unitValue } : {}),
      ...(patch.assetId !== undefined ? { assetId: patch.assetId } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.knowledgeNoteId !== undefined ? { knowledgeNoteId: patch.knowledgeNoteId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(homeInventory.id, id))
    .returning();
  return row ? m.inventoryRowTo(row) : null;
}

export async function deleteInventoryItem(db: Database, id: string): Promise<void> {
  await db.delete(homeInventory).where(eq(homeInventory.id, id));
}

export async function listReviews(db: Database): Promise<ResourceReview[]> {
  const rows = await db.select().from(resourceReviews).orderBy(desc(resourceReviews.periodStart));
  return rows.map(m.reviewRowTo);
}

export async function insertReview(db: Database, review: ResourceReview): Promise<ResourceReview> {
  const [row] = await db
    .insert(resourceReviews)
    .values({
      frequency: review.frequency,
      periodStart: review.periodStart,
      netWorth: review.netWorth,
      notes: review.notes,
      knowledgeNoteId: review.knowledgeNoteId,
    })
    .returning();
  return m.reviewRowTo(row!);
}
