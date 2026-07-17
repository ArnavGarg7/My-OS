import "server-only";
import { z } from "zod";
import {
  addClaimSchema,
  assetInputSchema,
  completeMaintenanceSchema,
  documentInputSchema,
  followUpSchema,
  forecastQuerySchema,
  interactionInputSchema,
  inventoryInputSchema,
  investmentAccountInputSchema,
  investmentTransactionSchema,
  maintenanceInputSchema,
  policyInputSchema,
  positionInputSchema,
  priceUpdateSchema,
  relationshipEventInputSchema,
  relationshipInputSchema,
  renewDocumentSchema,
  resourceReviewInputSchema,
  searchQuerySchema,
  travelDocumentInputSchema,
  updateAssetSchema,
  updateDocumentSchema,
  updateInventorySchema,
  updateMaintenanceSchema,
  updatePolicySchema,
  updatePositionSchema,
  updateRelationshipSchema,
  updateTravelDocumentSchema,
  updateVehicleSchema,
  vehicleInputSchema,
  type Asset,
  type AssetMaintenance,
  type HomeInventoryItem,
  type ImportantDocument,
  type InsurancePolicy,
  type InvestmentAccount,
  type InvestmentPosition,
  type Relationship,
  type RelationshipEvent,
  type RelationshipInteraction,
  type ResourceReview,
  type TravelDocument,
  type Vehicle,
} from "@myos/core/resource";
import { protectedProcedure, router } from "../trpc";
import * as forecasting from "./forecasting";
import * as maintenanceViews from "./maintenance";
import * as portfolioViews from "./portfolio";
import * as relationshipViews from "./relationships";
import * as service from "./service";
import * as statisticsViews from "./statistics";
import * as summaryViews from "./summary";

/**
 * Resource router (Sprint 4.3). Every procedure is protected, zod-validated and
 * deterministic. Reads are derived on demand — there is no `portfolio` row to fetch, only a
 * portfolio to compute.
 *
 * The zod `.optional()` fields produce `x?: T | undefined`, which is not assignable to
 * `Partial<T>` under exactOptionalPropertyTypes; the `as Partial<X>` casts below bridge
 * that, exactly as the Life and Knowledge routers do.
 */
const idInput = z.object({ id: z.string().uuid() });

export const resourceRouter = router({
  /* ── Derived reads (the AI seams) ─────────────────────────────────────── */
  portfolio: protectedProcedure.query(({ ctx }) => portfolioViews.portfolio(ctx.db)),
  investmentPortfolio: protectedProcedure.query(({ ctx }) =>
    portfolioViews.investmentPortfolio(ctx.db),
  ),
  summary: protectedProcedure.query(({ ctx }) => summaryViews.summary(ctx.db)),
  signals: protectedProcedure.query(({ ctx }) => summaryViews.signals(ctx.db)),
  statistics: protectedProcedure.query(({ ctx }) => statisticsViews.statistics(ctx.db)),
  correlations: protectedProcedure.query(({ ctx }) => statisticsViews.correlations(ctx.db)),
  forecast: protectedProcedure
    .input(forecastQuerySchema.optional())
    .query(({ ctx, input }) => forecasting.forecast(ctx.db, input?.horizonDays)),
  search: protectedProcedure
    .input(searchQuerySchema)
    .query(({ ctx, input }) => service.search(ctx.db, input.query, input.limit)),

  /* ── Investments ──────────────────────────────────────────────────────── */
  listInvestmentAccounts: protectedProcedure.query(({ ctx }) =>
    service.listInvestmentAccounts(ctx.db),
  ),
  createInvestmentAccount: protectedProcedure
    .input(investmentAccountInputSchema)
    .mutation(({ ctx, input }) =>
      service.createInvestmentAccount(
        ctx.db,
        input as { name: string } & Partial<InvestmentAccount>,
      ),
    ),

  listInvestments: protectedProcedure.query(({ ctx }) => service.listPositions(ctx.db)),
  createInvestment: protectedProcedure
    .input(positionInputSchema)
    .mutation(({ ctx, input }) =>
      service.createPosition(
        ctx.db,
        input as { accountId: string; symbol: string } & Partial<InvestmentPosition>,
      ),
    ),
  updateInvestment: protectedProcedure
    .input(updatePositionSchema)
    .mutation(({ ctx, input }) =>
      service.updatePosition(ctx.db, input.id, input as Partial<InvestmentPosition>),
    ),
  updatePrice: protectedProcedure
    .input(priceUpdateSchema)
    .mutation(({ ctx, input }) => service.updatePrice(ctx.db, input.id, input.currentPrice)),
  deleteInvestment: protectedProcedure
    .input(idInput)
    .mutation(({ ctx, input }) => service.deletePosition(ctx.db, input.id)),

  listInvestmentTransactions: protectedProcedure.query(({ ctx }) =>
    service.listInvestmentTransactions(ctx.db),
  ),
  recordInvestmentTransaction: protectedProcedure
    .input(investmentTransactionSchema)
    .mutation(({ ctx, input }) =>
      service.recordInvestmentTransaction(
        ctx.db,
        input as Parameters<typeof service.recordInvestmentTransaction>[1],
      ),
    ),

  /* ── Assets ───────────────────────────────────────────────────────────── */
  listAssets: protectedProcedure.query(({ ctx }) => service.listAssets(ctx.db)),
  createAsset: protectedProcedure
    .input(assetInputSchema)
    .mutation(({ ctx, input }) =>
      service.createAsset(ctx.db, input as { name: string } & Partial<Asset>),
    ),
  updateAsset: protectedProcedure
    .input(updateAssetSchema)
    .mutation(({ ctx, input }) => service.updateAsset(ctx.db, input.id, input as Partial<Asset>)),
  deleteAsset: protectedProcedure
    .input(idInput)
    .mutation(({ ctx, input }) => service.deleteAsset(ctx.db, input.id)),

  /* ── Maintenance ──────────────────────────────────────────────────────── */
  listMaintenance: protectedProcedure.query(({ ctx }) => service.listMaintenance(ctx.db)),
  maintenanceSchedule: protectedProcedure.query(({ ctx }) =>
    maintenanceViews.maintenanceSchedule(ctx.db),
  ),
  overdueMaintenance: protectedProcedure.query(({ ctx }) =>
    maintenanceViews.overdueMaintenance(ctx.db),
  ),
  upcomingMaintenance: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).optional() }).optional())
    .query(({ ctx, input }) => maintenanceViews.upcomingMaintenance(ctx.db, input?.days)),
  createMaintenance: protectedProcedure
    .input(maintenanceInputSchema)
    .mutation(({ ctx, input }) =>
      service.createMaintenance(
        ctx.db,
        input as { assetId: string; title: string; dueAt: string } & Partial<AssetMaintenance>,
      ),
    ),
  updateMaintenance: protectedProcedure
    .input(updateMaintenanceSchema)
    .mutation(({ ctx, input }) =>
      service.updateMaintenance(ctx.db, input.id, input as Partial<AssetMaintenance>),
    ),
  completeMaintenance: protectedProcedure
    .input(completeMaintenanceSchema)
    .mutation(({ ctx, input }) => service.completeMaintenance(ctx.db, input.id, input.cost)),

  /* ── Vehicles ─────────────────────────────────────────────────────────── */
  listVehicles: protectedProcedure.query(({ ctx }) => service.listVehicles(ctx.db)),
  createVehicle: protectedProcedure
    .input(vehicleInputSchema)
    .mutation(({ ctx, input }) =>
      service.createVehicle(ctx.db, input as { name: string } & Partial<Vehicle>),
    ),
  updateVehicle: protectedProcedure
    .input(updateVehicleSchema)
    .mutation(({ ctx, input }) =>
      service.updateVehicle(ctx.db, input.id, input as Partial<Vehicle>),
    ),
  vehicleRenewals: protectedProcedure.query(({ ctx }) =>
    maintenanceViews.vehicleRenewalItems(ctx.db),
  ),

  /* ── Insurance ────────────────────────────────────────────────────────── */
  listInsurance: protectedProcedure.query(({ ctx }) => service.listPolicies(ctx.db)),
  createPolicy: protectedProcedure
    .input(policyInputSchema)
    .mutation(({ ctx, input }) =>
      service.createPolicy(
        ctx.db,
        input as { name: string; expiresAt: string } & Partial<InsurancePolicy>,
      ),
    ),
  updatePolicy: protectedProcedure
    .input(updatePolicySchema)
    .mutation(({ ctx, input }) =>
      service.updatePolicy(ctx.db, input.id, input as Partial<InsurancePolicy>),
    ),
  addClaim: protectedProcedure
    .input(addClaimSchema)
    .mutation(({ ctx, input }) => service.addClaim(ctx.db, input.id, input.claim)),

  /* ── Documents ────────────────────────────────────────────────────────── */
  listDocuments: protectedProcedure.query(({ ctx }) => service.listDocuments(ctx.db)),
  createDocument: protectedProcedure
    .input(documentInputSchema)
    .mutation(({ ctx, input }) =>
      service.createDocument(ctx.db, input as { name: string } & Partial<ImportantDocument>),
    ),
  updateDocument: protectedProcedure
    .input(updateDocumentSchema)
    .mutation(({ ctx, input }) =>
      service.updateDocument(ctx.db, input.id, input as Partial<ImportantDocument>),
    ),
  renewDocument: protectedProcedure
    .input(renewDocumentSchema)
    .mutation(({ ctx, input }) => service.renewDocument(ctx.db, input.id, input.expiresAt)),

  /* ── Travel ───────────────────────────────────────────────────────────── */
  listTravel: protectedProcedure.query(({ ctx }) => service.listTravelDocuments(ctx.db)),
  createTravelDocument: protectedProcedure
    .input(travelDocumentInputSchema)
    .mutation(({ ctx, input }) =>
      service.createTravelDocument(ctx.db, input as { name: string } & Partial<TravelDocument>),
    ),
  updateTravelDocument: protectedProcedure
    .input(updateTravelDocumentSchema)
    .mutation(({ ctx, input }) =>
      service.updateTravelDocument(ctx.db, input.id, input as Partial<TravelDocument>),
    ),

  /* ── Relationships ────────────────────────────────────────────────────── */
  listRelationships: protectedProcedure.query(({ ctx }) => service.listRelationships(ctx.db)),
  createRelationship: protectedProcedure
    .input(relationshipInputSchema)
    .mutation(({ ctx, input }) =>
      service.createRelationship(ctx.db, input as { name: string } & Partial<Relationship>),
    ),
  updateRelationship: protectedProcedure
    .input(updateRelationshipSchema)
    .mutation(({ ctx, input }) =>
      service.updateRelationship(ctx.db, input.id, input as Partial<Relationship>),
    ),
  setFollowUp: protectedProcedure
    .input(followUpSchema)
    .mutation(({ ctx, input }) => service.setFollowUp(ctx.db, input.id, input.nextFollowUpAt)),

  relationshipHealth: protectedProcedure.query(({ ctx }) => relationshipViews.health(ctx.db)),
  birthdays: protectedProcedure.query(({ ctx }) => relationshipViews.birthdays(ctx.db)),
  allDates: protectedProcedure.query(({ ctx }) => relationshipViews.allDates(ctx.db)),
  mostConnected: protectedProcedure.query(({ ctx }) => relationshipViews.connected(ctx.db)),

  listInteractions: protectedProcedure.query(({ ctx }) => service.listInteractions(ctx.db)),
  interactionsFor: protectedProcedure
    .input(z.object({ relationshipId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      relationshipViews.interactionsForRelationship(ctx.db, input.relationshipId),
    ),
  logInteraction: protectedProcedure
    .input(interactionInputSchema)
    .mutation(({ ctx, input }) =>
      service.logInteraction(
        ctx.db,
        input as { relationshipId: string } & Partial<RelationshipInteraction>,
      ),
    ),

  listRelationshipEvents: protectedProcedure.query(({ ctx }) =>
    service.listRelationshipEvents(ctx.db),
  ),
  logRelationshipEvent: protectedProcedure
    .input(relationshipEventInputSchema)
    .mutation(({ ctx, input }) =>
      service.logRelationshipEvent(
        ctx.db,
        input as { relationshipId: string; title: string } & Partial<RelationshipEvent>,
      ),
    ),

  /* ── Home ─────────────────────────────────────────────────────────────── */
  listInventory: protectedProcedure.query(({ ctx }) => service.listInventory(ctx.db)),
  createInventoryItem: protectedProcedure
    .input(inventoryInputSchema)
    .mutation(({ ctx, input }) =>
      service.createInventoryItem(ctx.db, input as { name: string } & Partial<HomeInventoryItem>),
    ),
  updateInventoryItem: protectedProcedure
    .input(updateInventorySchema)
    .mutation(({ ctx, input }) =>
      service.updateInventoryItem(ctx.db, input.id, input as Partial<HomeInventoryItem>),
    ),
  deleteInventoryItem: protectedProcedure
    .input(idInput)
    .mutation(({ ctx, input }) => service.deleteInventoryItem(ctx.db, input.id)),

  /* ── Reviews ──────────────────────────────────────────────────────────── */
  listReviews: protectedProcedure.query(({ ctx }) => service.listReviews(ctx.db)),
  createReview: protectedProcedure
    .input(resourceReviewInputSchema)
    .mutation(({ ctx, input }) =>
      service.createReview(
        ctx.db,
        input as { frequency: ResourceReview["frequency"] } & Partial<ResourceReview>,
      ),
    ),
});
