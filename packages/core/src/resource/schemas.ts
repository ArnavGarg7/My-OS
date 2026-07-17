import { z } from "zod";
import {
  ASSET_TYPES,
  DOCUMENT_TYPES,
  INSURANCE_TYPES,
  INTERACTION_TYPES,
  INVESTMENT_TYPES,
  RELATIONSHIP_TYPES,
  RESOURCE_REVIEW_FREQUENCIES,
  TRAVEL_DOCUMENT_TYPES,
  VEHICLE_TYPES,
} from "./constants";

/**
 * Resource platform zod schemas (Sprint 4.3). Validate the tRPC surface. Every derived view
 * (portfolio/summary/statistics/forecast) is a query over these — none of them are inputs,
 * because none of them are stored.
 */
const name = z.string().min(1).max(200);
const id = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** Year-agnostic MM-DD, so birthdays recur without storing a year. */
const monthDay = z.string().regex(/^\d{2}-\d{2}$/);
const money = z.number().min(0).max(1_000_000_000);
const knowledgeNoteId = id.nullable().optional();

export const investmentAccountInputSchema = z.object({
  name,
  institution: z.string().max(200).optional(),
  financeAccountId: id.nullable().optional(),
  knowledgeNoteId,
});
export const updateInvestmentAccountSchema = investmentAccountInputSchema.partial().extend({ id });

export const positionInputSchema = z.object({
  accountId: id,
  symbol: z.string().min(1).max(30),
  name: z.string().max(200).optional(),
  type: z.enum(INVESTMENT_TYPES).optional(),
  quantity: z.number().min(0).max(1_000_000_000).optional(),
  averageCost: money.optional(),
  currentPrice: money.optional(),
  knowledgeNoteId,
});
export const updatePositionSchema = positionInputSchema.partial().extend({ id });
/** Price updates are their own endpoint — they are the one field users touch repeatedly. */
export const priceUpdateSchema = z.object({ id, currentPrice: money });

export const investmentTransactionSchema = z.object({
  positionId: id,
  direction: z.enum(["buy", "sell"]),
  quantity: z.number().min(0).max(1_000_000_000),
  price: money,
  fees: money.optional(),
  occurredAt: z.string().optional(),
});

export const assetInputSchema = z.object({
  name,
  type: z.enum(ASSET_TYPES).optional(),
  purchasePrice: money.optional(),
  purchasedAt: dateStr.optional(),
  currentValue: money.nullable().optional(),
  depreciationRate: z.number().min(0).max(1).nullable().optional(),
  warrantyExpiresAt: dateStr.nullable().optional(),
  serialNumber: z.string().max(120).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  knowledgeNoteId,
});
export const updateAssetSchema = assetInputSchema.partial().extend({ id });

export const maintenanceInputSchema = z.object({
  assetId: id,
  title: name,
  dueAt: dateStr,
  cost: money.optional(),
  intervalDays: z.number().int().min(0).max(3650).optional(),
  notes: z.string().max(2000).optional(),
});
export const updateMaintenanceSchema = maintenanceInputSchema.partial().extend({ id });
export const completeMaintenanceSchema = z.object({ id, cost: money.optional() });

export const vehicleInputSchema = z.object({
  name,
  type: z.enum(VEHICLE_TYPES).optional(),
  registrationNumber: z.string().max(40).optional(),
  assetId: id.nullable().optional(),
  odometer: z.number().min(0).max(10_000_000).optional(),
  registrationExpiresAt: dateStr.nullable().optional(),
  pollutionExpiresAt: dateStr.nullable().optional(),
  insurancePolicyId: id.nullable().optional(),
  notes: z.string().max(2000).optional(),
  knowledgeNoteId,
});
export const updateVehicleSchema = vehicleInputSchema.partial().extend({ id });

export const policyInputSchema = z.object({
  name,
  type: z.enum(INSURANCE_TYPES).optional(),
  provider: z.string().max(200).optional(),
  policyNumber: z.string().max(80).optional(),
  coverageAmount: money.optional(),
  premium: money.optional(),
  premiumIntervalMonths: z.number().int().min(1).max(120).optional(),
  startsAt: dateStr.optional(),
  expiresAt: dateStr,
  beneficiaries: z.array(z.string().max(200)).max(20).optional(),
  assetId: id.nullable().optional(),
  knowledgeNoteId,
});
export const updatePolicySchema = policyInputSchema
  .partial()
  .extend({ id, expiresAt: dateStr.optional() });
export const addClaimSchema = z.object({ id, claim: z.string().min(1).max(1000) });

export const documentInputSchema = z.object({
  name,
  type: z.enum(DOCUMENT_TYPES).optional(),
  documentNumber: z.string().max(80).optional(),
  issuedAt: dateStr.nullable().optional(),
  expiresAt: dateStr.nullable().optional(),
  issuer: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  knowledgeNoteId,
});
export const updateDocumentSchema = documentInputSchema.partial().extend({ id });
/** Renewing pushes the expiry out; it does not create a second row. */
export const renewDocumentSchema = z.object({ id, expiresAt: dateStr });

export const travelDocumentInputSchema = z.object({
  name,
  type: z.enum(TRAVEL_DOCUMENT_TYPES).optional(),
  reference: z.string().max(80).optional(),
  country: z.string().max(100).optional(),
  issuedAt: dateStr.nullable().optional(),
  expiresAt: dateStr.nullable().optional(),
  notes: z.string().max(2000).optional(),
  knowledgeNoteId,
});
export const updateTravelDocumentSchema = travelDocumentInputSchema.partial().extend({ id });

export const relationshipInputSchema = z.object({
  name,
  type: z.enum(RELATIONSHIP_TYPES).optional(),
  company: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  birthday: monthDay.nullable().optional(),
  anniversary: monthDay.nullable().optional(),
  interests: z.array(z.string().max(100)).max(30).optional(),
  notes: z.string().max(5000).optional(),
  nextFollowUpAt: dateStr.nullable().optional(),
  knowledgeNoteId,
});
export const updateRelationshipSchema = relationshipInputSchema.partial().extend({
  id,
  archived: z.boolean().optional(),
});

export const interactionInputSchema = z.object({
  relationshipId: id,
  type: z.enum(INTERACTION_TYPES).optional(),
  notes: z.string().max(2000).optional(),
  occurredAt: z.string().optional(),
});

export const relationshipEventInputSchema = z.object({
  relationshipId: id,
  title: name,
  kind: z.string().max(50).optional(),
  occurredAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const followUpSchema = z.object({ id, nextFollowUpAt: dateStr.nullable() });

export const inventoryInputSchema = z.object({
  name,
  room: z.string().max(100).optional(),
  quantity: z.number().int().min(0).max(100_000).optional(),
  unitValue: money.optional(),
  assetId: id.nullable().optional(),
  notes: z.string().max(2000).optional(),
  knowledgeNoteId,
});
export const updateInventorySchema = inventoryInputSchema.partial().extend({ id });

export const resourceReviewInputSchema = z.object({
  frequency: z.enum(RESOURCE_REVIEW_FREQUENCIES),
  periodStart: dateStr.optional(),
  notes: z.string().max(5000).optional(),
  knowledgeNoteId,
});

export const forecastQuerySchema = z.object({
  horizonDays: z.number().int().min(1).max(730).optional(),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).optional(),
});

export const idSchema = z.object({ id });
