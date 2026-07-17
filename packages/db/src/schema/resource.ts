/**
 * Resource & Relationship Platform schema (Sprint 4.3, Phase 4). The system of record for
 * everything owned, managed and maintained: investments (accounts/positions/ledger), assets
 * + maintenance, vehicles, insurance, documents, travel identity, the personal CRM
 * (relationships/interactions/events), home inventory and resource reviews.
 *
 * Extends — never replaces — Finance (2.11): `accounts`/`transactions` stay Finance's; this
 * schema links to them by id and gains its own `investment_account_id`/`asset_id` columns on
 * the Finance side (migration 0027). Derived views (net worth, allocation, depreciation,
 * relationship strength, every countdown) are NOT stored — no `net_worth` column exists
 * anywhere, because a stored total is wrong by tomorrow. Single user (05 §0: no user_id).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const investmentType = pgEnum("investment_type", [
  "stock",
  "etf",
  "mutual_fund",
  "bond",
  "crypto",
  "fixed_deposit",
  "gold",
  "real_estate",
]);
export const assetType = pgEnum("asset_type", [
  "electronics",
  "furniture",
  "jewelry",
  "equipment",
  "property",
  "collection",
  "digital",
  "vehicle",
]);
export const documentType = pgEnum("document_type", [
  "passport",
  "driving_license",
  "pan",
  "aadhaar",
  "certificate",
  "medical",
  "insurance",
  "property",
  "tax",
  "academic",
]);
export const relationshipType = pgEnum("relationship_type", [
  "friend",
  "family",
  "mentor",
  "professor",
  "colleague",
  "manager",
  "recruiter",
  "investor",
  "networking",
]);
export const interactionType = pgEnum("interaction_type", [
  "call",
  "meeting",
  "email",
  "message",
  "coffee",
  "conference",
  "travel",
  "gift",
  "follow_up",
]);
/**
 * Present for completeness of the domain vocabulary, but maintenance status is DERIVED at
 * read time by comparing `due_at` to the clock — it is deliberately not a column, so a row
 * can never sit in the database claiming to be "scheduled" a year after it went overdue.
 */
export const maintenanceStatus = pgEnum("maintenance_status", [
  "scheduled",
  "overdue",
  "completed",
]);
export const insuranceType = pgEnum("insurance_type", [
  "health",
  "life",
  "vehicle",
  "home",
  "travel",
  "device",
]);
export const vehicleType = pgEnum("vehicle_type", [
  "car",
  "motorcycle",
  "scooter",
  "bicycle",
  "other",
]);

/* ── Investments ────────────────────────────────────────────────────────── */

export const investmentAccounts = pgTable("investment_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  institution: text("institution").notNull().default(""),
  /** Soft link to a Finance (2.11) account — no FK, so Finance can evolve independently. */
  financeAccountId: uuid("finance_account_id"),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const investmentPositions = pgTable(
  "investment_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => investmentAccounts.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    name: text("name").notNull().default(""),
    type: investmentType("type").notNull().default("stock"),
    quantity: doublePrecision("quantity").notNull().default(0),
    /** Cache of the ledger: re-derived from investment_transactions on every write. */
    averageCost: doublePrecision("average_cost").notNull().default(0),
    /** User-entered. There are no market APIs in this platform. */
    currentPrice: doublePrecision("current_price").notNull().default(0),
    pricedAt: timestamp("priced_at", { withTimezone: true }),
    knowledgeNoteId: uuid("knowledge_note_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byAccount: index("investment_positions_account_idx").on(t.accountId) }),
);

export const investmentTransactions = pgTable(
  "investment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    positionId: uuid("position_id")
      .notNull()
      .references(() => investmentPositions.id, { onDelete: "cascade" }),
    direction: text("direction").notNull().default("buy"),
    quantity: doublePrecision("quantity").notNull().default(0),
    price: doublePrecision("price").notNull().default(0),
    fees: doublePrecision("fees").notNull().default(0),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byPosition: index("investment_transactions_position_idx").on(t.positionId) }),
);

/* ── Assets ─────────────────────────────────────────────────────────────── */

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: assetType("type").notNull().default("electronics"),
    purchasePrice: doublePrecision("purchase_price").notNull().default(0),
    purchasedAt: date("purchased_at", { mode: "string" }).notNull(),
    /** Explicit override; null = the valuation engine depreciates the purchase price. */
    currentValue: doublePrecision("current_value"),
    depreciationRate: doublePrecision("depreciation_rate"),
    warrantyExpiresAt: date("warranty_expires_at", { mode: "string" }),
    serialNumber: text("serial_number").notNull().default(""),
    location: text("location").notNull().default(""),
    notes: text("notes").notNull().default(""),
    knowledgeNoteId: uuid("knowledge_note_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byType: index("assets_type_idx").on(t.type) }),
);

export const assetMaintenance = pgTable(
  "asset_maintenance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueAt: date("due_at", { mode: "string" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cost: doublePrecision("cost").notNull().default(0),
    notes: text("notes").notNull().default(""),
    /** 0 = one-off; otherwise the recurrence stride in days. */
    intervalDays: integer("interval_days").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byAsset: index("asset_maintenance_asset_idx").on(t.assetId),
    byDue: index("asset_maintenance_due_idx").on(t.dueAt),
  }),
);

/* ── Vehicles ───────────────────────────────────────────────────────────── */

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: vehicleType("type").notNull().default("car"),
  registrationNumber: text("registration_number").notNull().default(""),
  /** Service history hangs off the linked asset — one scheduler, not two. */
  assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
  odometer: doublePrecision("odometer").notNull().default(0),
  registrationExpiresAt: date("registration_expires_at", { mode: "string" }),
  pollutionExpiresAt: date("pollution_expires_at", { mode: "string" }),
  insurancePolicyId: uuid("insurance_policy_id"),
  notes: text("notes").notNull().default(""),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Insurance ──────────────────────────────────────────────────────────── */

export const insurancePolicies = pgTable(
  "insurance_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: insuranceType("type").notNull().default("health"),
    provider: text("provider").notNull().default(""),
    policyNumber: text("policy_number").notNull().default(""),
    coverageAmount: doublePrecision("coverage_amount").notNull().default(0),
    premium: doublePrecision("premium").notNull().default(0),
    premiumIntervalMonths: integer("premium_interval_months").notNull().default(12),
    startsAt: date("starts_at", { mode: "string" }).notNull(),
    expiresAt: date("expires_at", { mode: "string" }).notNull(),
    beneficiaries: jsonb("beneficiaries").$type<string[]>().notNull().default([]),
    /** Claim history as recorded text. The platform records; it does not adjudicate. */
    claims: jsonb("claims").$type<string[]>().notNull().default([]),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
    knowledgeNoteId: uuid("knowledge_note_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byExpiry: index("insurance_policies_expires_idx").on(t.expiresAt) }),
);

/* ── Documents ──────────────────────────────────────────────────────────── */

/** Metadata only — no file bytes, no encrypted vault. See core/documents.ts. */
export const importantDocuments = pgTable(
  "important_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: documentType("type").notNull().default("certificate"),
    documentNumber: text("document_number").notNull().default(""),
    issuedAt: date("issued_at", { mode: "string" }),
    expiresAt: date("expires_at", { mode: "string" }),
    issuer: text("issuer").notNull().default(""),
    location: text("location").notNull().default(""),
    notes: text("notes").notNull().default(""),
    knowledgeNoteId: uuid("knowledge_note_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byExpiry: index("important_documents_expires_idx").on(t.expiresAt) }),
);

export const travelDocuments = pgTable(
  "travel_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull().default("passport"),
    reference: text("reference").notNull().default(""),
    country: text("country").notNull().default(""),
    issuedAt: date("issued_at", { mode: "string" }),
    expiresAt: date("expires_at", { mode: "string" }),
    notes: text("notes").notNull().default(""),
    knowledgeNoteId: uuid("knowledge_note_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byExpiry: index("travel_documents_expires_idx").on(t.expiresAt) }),
);

/* ── Personal CRM ───────────────────────────────────────────────────────── */

export const relationships = pgTable(
  "relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: relationshipType("type").notNull().default("friend"),
    company: text("company").notNull().default(""),
    role: text("role").notNull().default(""),
    location: text("location").notNull().default(""),
    /** MM-DD — year-agnostic so occurrences are resolved on read, never stored. */
    birthday: text("birthday"),
    anniversary: text("anniversary"),
    interests: jsonb("interests").$type<string[]>().notNull().default([]),
    notes: text("notes").notNull().default(""),
    nextFollowUpAt: date("next_follow_up_at", { mode: "string" }),
    knowledgeNoteId: uuid("knowledge_note_id"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byArchived: index("relationships_archived_idx").on(t.archived) }),
);

export const relationshipInteractions = pgTable(
  "relationship_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    relationshipId: uuid("relationship_id")
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    type: interactionType("type").notNull().default("message"),
    notes: text("notes").notNull().default(""),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byRelationship: index("relationship_interactions_relationship_idx").on(t.relationshipId),
    byOccurred: index("relationship_interactions_occurred_idx").on(t.occurredAt),
  }),
);

/** Conferences, referrals, introductions — the networking ledger. */
export const relationshipEvents = pgTable(
  "relationship_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    relationshipId: uuid("relationship_id")
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("conference"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byRelationship: index("relationship_events_relationship_idx").on(t.relationshipId) }),
);

/* ── Home ───────────────────────────────────────────────────────────────── */

export const homeInventory = pgTable(
  "home_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    room: text("room").notNull().default(""),
    quantity: integer("quantity").notNull().default(1),
    unitValue: doublePrecision("unit_value").notNull().default(0),
    /** Promote to a full asset when it deserves depreciation/warranty/maintenance. */
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
    notes: text("notes").notNull().default(""),
    knowledgeNoteId: uuid("knowledge_note_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byRoom: index("home_inventory_room_idx").on(t.room) }),
);

/* ── Reviews ────────────────────────────────────────────────────────────── */

export const resourceReviews = pgTable("resource_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  frequency: text("frequency").notNull().default("quarterly"),
  periodStart: date("period_start", { mode: "string" }).notNull(),
  /** A snapshot captured at review time — a historical record, not a source of truth. */
  netWorth: doublePrecision("net_worth").notNull().default(0),
  notes: text("notes").notNull().default(""),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Relations ──────────────────────────────────────────────────────────── */

export const investmentAccountsRelations = relations(investmentAccounts, ({ many }) => ({
  positions: many(investmentPositions),
}));

export const investmentPositionsRelations = relations(investmentPositions, ({ one, many }) => ({
  account: one(investmentAccounts, {
    fields: [investmentPositions.accountId],
    references: [investmentAccounts.id],
  }),
  transactions: many(investmentTransactions),
}));

export const investmentTransactionsRelations = relations(investmentTransactions, ({ one }) => ({
  position: one(investmentPositions, {
    fields: [investmentTransactions.positionId],
    references: [investmentPositions.id],
  }),
}));

export const assetsRelations = relations(assets, ({ many }) => ({
  maintenance: many(assetMaintenance),
}));

export const assetMaintenanceRelations = relations(assetMaintenance, ({ one }) => ({
  asset: one(assets, { fields: [assetMaintenance.assetId], references: [assets.id] }),
}));

export const relationshipsRelations = relations(relationships, ({ many }) => ({
  interactions: many(relationshipInteractions),
  events: many(relationshipEvents),
}));

export const relationshipInteractionsRelations = relations(relationshipInteractions, ({ one }) => ({
  relationship: one(relationships, {
    fields: [relationshipInteractions.relationshipId],
    references: [relationships.id],
  }),
}));

export const relationshipEventsRelations = relations(relationshipEvents, ({ one }) => ({
  relationship: one(relationships, {
    fields: [relationshipEvents.relationshipId],
    references: [relationships.id],
  }),
}));

/* ── Row types ──────────────────────────────────────────────────────────── */

export type InvestmentAccountRow = typeof investmentAccounts.$inferSelect;
export type InvestmentPositionRow = typeof investmentPositions.$inferSelect;
export type InvestmentTransactionRow = typeof investmentTransactions.$inferSelect;
export type AssetRow = typeof assets.$inferSelect;
export type AssetMaintenanceRow = typeof assetMaintenance.$inferSelect;
export type VehicleRow = typeof vehicles.$inferSelect;
export type InsurancePolicyRow = typeof insurancePolicies.$inferSelect;
export type ImportantDocumentRow = typeof importantDocuments.$inferSelect;
export type TravelDocumentRow = typeof travelDocuments.$inferSelect;
export type RelationshipRow = typeof relationships.$inferSelect;
export type RelationshipInteractionRow = typeof relationshipInteractions.$inferSelect;
export type RelationshipEventRow = typeof relationshipEvents.$inferSelect;
export type HomeInventoryRow = typeof homeInventory.$inferSelect;
export type ResourceReviewRow = typeof resourceReviews.$inferSelect;
