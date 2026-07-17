"use client";

import { useState } from "react";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Resource Platform controller (Sprint 4.3). Owns every resource query + mutation —
 * investments, assets, maintenance, vehicles, insurance, documents, travel, relationships,
 * interactions, home inventory, reviews — and emits timeline + analytics events on
 * mutation success. Deterministic: it reflects engine state and computes nothing itself.
 */
export function useResource() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Derived reads — every one of these recomputes server-side on each fetch.
  const portfolio = trpc.resource.portfolio.useQuery();
  const investmentPortfolio = trpc.resource.investmentPortfolio.useQuery();
  const summary = trpc.resource.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const statistics = trpc.resource.statistics.useQuery();
  const correlations = trpc.resource.correlations.useQuery();
  const forecast = trpc.resource.forecast.useQuery({});

  // Collections.
  const accounts = trpc.resource.listInvestmentAccounts.useQuery();
  const investments = trpc.resource.listInvestments.useQuery();
  const assets = trpc.resource.listAssets.useQuery();
  const maintenance = trpc.resource.maintenanceSchedule.useQuery();
  const vehicles = trpc.resource.listVehicles.useQuery();
  const insurance = trpc.resource.listInsurance.useQuery();
  const documents = trpc.resource.listDocuments.useQuery();
  const travel = trpc.resource.listTravel.useQuery();
  const relationships = trpc.resource.listRelationships.useQuery();
  const relationshipHealth = trpc.resource.relationshipHealth.useQuery();
  const birthdays = trpc.resource.birthdays.useQuery();
  const allDates = trpc.resource.allDates.useQuery();
  const interactions = trpc.resource.listInteractions.useQuery();
  const relationshipEvents = trpc.resource.listRelationshipEvents.useQuery();
  const inventory = trpc.resource.listInventory.useQuery();
  const reviews = trpc.resource.listReviews.useQuery();

  const refresh = () => utils.resource.invalidate();

  /* ── Investments ──────────────────────────────────────────────────────── */

  const createInvestmentAccount = trpc.resource.createInvestmentAccount.useMutation({
    onSuccess: refresh,
  });

  const createInvestment = trpc.resource.createInvestment.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Investment added");
      timeline.emit({
        kind: "investment.updated",
        source: "resource",
        title: "Investment added",
      });
    },
  });

  const updatePrice = trpc.resource.updatePrice.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "investment.updated", source: "resource", title: "Price updated" });
      analytics.track({ kind: "resource.investment_allocation", value: 1 });
    },
  });

  const recordTransaction = trpc.resource.recordInvestmentTransaction.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Transaction recorded");
      timeline.emit({
        kind: "investment.updated",
        source: "resource",
        title: "Transaction recorded",
      });
    },
  });

  const deleteInvestment = trpc.resource.deleteInvestment.useMutation({ onSuccess: refresh });

  /* ── Assets + maintenance ─────────────────────────────────────────────── */

  const createAsset = trpc.resource.createAsset.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Asset added");
      timeline.emit({ kind: "asset.added", source: "resource", title: "Asset added" });
    },
  });

  const updateAsset = trpc.resource.updateAsset.useMutation({ onSuccess: refresh });
  const deleteAsset = trpc.resource.deleteAsset.useMutation({ onSuccess: refresh });
  const createMaintenance = trpc.resource.createMaintenance.useMutation({ onSuccess: refresh });

  const completeMaintenance = trpc.resource.completeMaintenance.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Maintenance completed");
      timeline.emit({
        kind: "maintenance.completed",
        source: "resource",
        title: "Maintenance completed",
      });
      analytics.track({ kind: "resource.maintenance_completion", value: 1 });
    },
  });

  /* ── Vehicles ─────────────────────────────────────────────────────────── */

  const createVehicle = trpc.resource.createVehicle.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Vehicle added");
    },
  });
  const updateVehicle = trpc.resource.updateVehicle.useMutation({ onSuccess: refresh });

  /* ── Insurance ────────────────────────────────────────────────────────── */

  const createPolicy = trpc.resource.createPolicy.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Policy added");
      analytics.track({ kind: "resource.insurance_coverage", value: 1 });
    },
  });

  const updatePolicy = trpc.resource.updatePolicy.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({
        kind: "insurance.renewed",
        source: "resource",
        title: "Insurance updated",
      });
    },
  });

  const addClaim = trpc.resource.addClaim.useMutation({ onSuccess: refresh });

  /* ── Documents + travel ───────────────────────────────────────────────── */

  const createDocument = trpc.resource.createDocument.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Document catalogued");
      analytics.track({ kind: "resource.document_health", value: 1 });
    },
  });

  const renewDocument = trpc.resource.renewDocument.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Document renewed");
      timeline.emit({ kind: "document.renewed", source: "resource", title: "Document renewed" });
    },
  });

  const createTravelDocument = trpc.resource.createTravelDocument.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Travel document added");
    },
  });

  /* ── Relationships ────────────────────────────────────────────────────── */

  const createRelationship = trpc.resource.createRelationship.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Contact added");
      timeline.emit({
        kind: "relationship.created",
        source: "resource",
        title: "Relationship added",
      });
    },
  });

  const updateRelationship = trpc.resource.updateRelationship.useMutation({ onSuccess: refresh });

  const logInteraction = trpc.resource.logInteraction.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Interaction logged");
      timeline.emit({
        kind: "interaction.logged",
        source: "resource",
        title: "Interaction logged",
      });
      analytics.track({ kind: "resource.relationship_activity", value: 1 });
    },
  });

  const logRelationshipEvent = trpc.resource.logRelationshipEvent.useMutation({
    onSuccess: refresh,
  });

  const setFollowUp = trpc.resource.setFollowUp.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Follow-up scheduled");
    },
  });

  /* ── Home + reviews ───────────────────────────────────────────────────── */

  const createInventoryItem = trpc.resource.createInventoryItem.useMutation({ onSuccess: refresh });
  const deleteInventoryItem = trpc.resource.deleteInventoryItem.useMutation({ onSuccess: refresh });

  const createReview = trpc.resource.createReview.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Review captured");
      analytics.track({ kind: "resource.net_worth", value: portfolio.data?.netWorth ?? 0 });
    },
  });

  const isLoading =
    portfolio.isLoading || summary.isLoading || assets.isLoading || relationships.isLoading;

  return {
    // derived
    portfolio: portfolio.data,
    investmentPortfolio: investmentPortfolio.data,
    summary: summary.data,
    statistics: statistics.data,
    correlations: correlations.data ?? [],
    forecast: forecast.data,
    // collections
    accounts: accounts.data ?? [],
    investments: investments.data ?? [],
    assets: assets.data ?? [],
    maintenance: maintenance.data ?? [],
    vehicles: vehicles.data ?? [],
    insurance: insurance.data ?? [],
    documents: documents.data ?? [],
    travel: travel.data ?? [],
    relationships: relationships.data ?? [],
    relationshipHealth: relationshipHealth.data ?? [],
    birthdays: birthdays.data ?? [],
    allDates: allDates.data ?? [],
    interactions: interactions.data ?? [],
    relationshipEvents: relationshipEvents.data ?? [],
    inventory: inventory.data ?? [],
    reviews: reviews.data ?? [],
    isLoading,
    // selection
    selectedRelationshipId,
    setSelectedRelationshipId,
    selectedAssetId,
    setSelectedAssetId,
    // mutations
    createInvestmentAccount: createInvestmentAccount.mutate,
    createInvestment: createInvestment.mutate,
    updatePrice: updatePrice.mutate,
    recordTransaction: recordTransaction.mutate,
    deleteInvestment: deleteInvestment.mutate,
    createAsset: createAsset.mutate,
    updateAsset: updateAsset.mutate,
    deleteAsset: deleteAsset.mutate,
    createMaintenance: createMaintenance.mutate,
    completeMaintenance: completeMaintenance.mutate,
    createVehicle: createVehicle.mutate,
    updateVehicle: updateVehicle.mutate,
    createPolicy: createPolicy.mutate,
    updatePolicy: updatePolicy.mutate,
    addClaim: addClaim.mutate,
    createDocument: createDocument.mutate,
    renewDocument: renewDocument.mutate,
    createTravelDocument: createTravelDocument.mutate,
    createRelationship: createRelationship.mutate,
    updateRelationship: updateRelationship.mutate,
    logInteraction: logInteraction.mutate,
    logRelationshipEvent: logRelationshipEvent.mutate,
    setFollowUp: setFollowUp.mutate,
    createInventoryItem: createInventoryItem.mutate,
    deleteInventoryItem: deleteInventoryItem.mutate,
    createReview: createReview.mutate,
  };
}
