import type {
  AssetType,
  DocumentType,
  InsuranceType,
  InteractionType,
  InvestmentType,
  MaintenanceStatus,
  RelationshipStrength,
  RelationshipType,
  ResourceReviewFrequency,
  TravelDocumentType,
  VehicleType,
} from "./constants";

/**
 * Resource & Relationship Platform types (Sprint 4.3). Raw entities (investments, assets,
 * vehicles, insurance, documents, relationships, travel) plus the derived views (valuation,
 * portfolio, strength, forecast, statistics). Derived values are ALWAYS recomputed — net
 * worth, allocation, gains, depreciation, relationship strength and every countdown are
 * functions of the stored rows, never columns.
 *
 * Every resource entity carries `knowledgeNoteId` so the Knowledge platform (4.1) can hold
 * the thesis, receipt, manual or meeting note behind the row without owning the row.
 */

/* ── Investments ────────────────────────────────────────────────────────── */

export interface InvestmentAccount {
  id: string;
  name: string;
  /** Broker / fund house / exchange holding the positions. */
  institution: string;
  /** Optional link to a Finance (2.11) account — ids only, no duplication. */
  financeAccountId: string | null;
  knowledgeNoteId: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface InvestmentPosition {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  /** Weighted-average cost per unit, in ₹. Derived from transactions on write. */
  averageCost: number;
  /** Latest user-entered price per unit, in ₹. No market APIs — ever. */
  currentPrice: number;
  /** When `currentPrice` was last entered; drives the stale-price signal. */
  pricedAt: string | null; // ISO
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTransaction {
  id: string;
  positionId: string;
  /** "buy" adds units at `price`; "sell" removes them. */
  direction: "buy" | "sell";
  quantity: number;
  price: number; // per unit, ₹
  fees: number;
  occurredAt: string; // ISO
  createdAt: string;
}

/** Derived per-position view — cost basis, market value, gain. Never stored. */
export interface PositionValuation {
  positionId: string;
  symbol: string;
  type: InvestmentType;
  quantity: number;
  costBasis: number;
  marketValue: number;
  gain: number;
  gainPercent: number;
}

/** Derived allocation slice by investment type. */
export interface AllocationSlice {
  type: InvestmentType;
  value: number;
  share: number; // 0–1
}

/** Derived whole-portfolio view. */
export interface InvestmentPortfolio {
  costBasis: number;
  marketValue: number;
  gain: number;
  gainPercent: number;
  positions: PositionValuation[];
  allocation: AllocationSlice[];
  /** True when any single type exceeds PORTFOLIO_CONCENTRATION_LIMIT. */
  unbalanced: boolean;
  /** The over-weighted type, when unbalanced. */
  concentratedIn: InvestmentType | null;
}

/* ── Assets ─────────────────────────────────────────────────────────────── */

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  purchasePrice: number;
  purchasedAt: string; // ISO date
  /** Explicit current value; when null the valuation engine depreciates the purchase price. */
  currentValue: number | null;
  /** Straight-line annual rate override; null = the type default. */
  depreciationRate: number | null;
  warrantyExpiresAt: string | null; // ISO date
  serialNumber: string;
  location: string;
  notes: string;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Derived asset value at a point in time. */
export interface AssetValuation {
  assetId: string;
  name: string;
  type: AssetType;
  purchasePrice: number;
  currentValue: number;
  depreciation: number;
  /** True when the warranty is still live at the valuation date. */
  underWarranty: boolean;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  title: string;
  /** When the work is/was due. Status is derived by comparing this to `now`. */
  dueAt: string; // ISO date
  completedAt: string | null; // ISO
  cost: number;
  notes: string;
  /** Recurrence in days; 0 = one-off. Drives the next scheduled occurrence. */
  intervalDays: number;
  createdAt: string;
  updatedAt: string;
}

/** Derived maintenance view — status is computed, never stored. */
export interface MaintenanceView {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  dueAt: string;
  status: MaintenanceStatus;
  daysUntilDue: number; // negative = overdue
  cost: number;
}

/* ── Home ───────────────────────────────────────────────────────────────── */

export interface HomeInventoryItem {
  id: string;
  name: string;
  room: string;
  quantity: number;
  unitValue: number;
  /** Optional link to a full Asset row when the item is tracked in detail. */
  assetId: string | null;
  notes: string;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Vehicles ───────────────────────────────────────────────────────────── */

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  registrationNumber: string;
  /** Optional link to the Asset row representing this vehicle. */
  assetId: string | null;
  /** Odometer in km at the last log; used for service-interval scheduling. */
  odometer: number;
  registrationExpiresAt: string | null; // ISO date
  pollutionExpiresAt: string | null; // ISO date
  insurancePolicyId: string | null;
  notes: string;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Insurance ──────────────────────────────────────────────────────────── */

export interface InsurancePolicy {
  id: string;
  name: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  /** Premium cadence in months (12 = annual); drives the cost forecast. */
  premiumIntervalMonths: number;
  startsAt: string; // ISO date
  expiresAt: string; // ISO date
  beneficiaries: string[];
  /** Free-text claim history entries; the platform records, it does not adjudicate. */
  claims: string[];
  /** Optional link to the asset/vehicle this policy covers. */
  assetId: string | null;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Documents ──────────────────────────────────────────────────────────── */

/**
 * Metadata only. There is no encrypted vault and no file bytes in this platform — a
 * document row records what exists, where it lives and when it dies. Files may be attached
 * in a later sprint without changing this shape.
 */
export interface ImportantDocument {
  id: string;
  name: string;
  type: DocumentType;
  documentNumber: string;
  issuedAt: string | null; // ISO date
  expiresAt: string | null; // ISO date
  issuer: string;
  /** Physical or logical location — "safe", "cloud/drive", "wallet". */
  location: string;
  notes: string;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Travel & identity ──────────────────────────────────────────────────── */

export interface TravelDocument {
  id: string;
  name: string;
  type: TravelDocumentType;
  /** Membership/document identifier — passport no., FF number, policy no. */
  reference: string;
  country: string;
  issuedAt: string | null; // ISO date
  expiresAt: string | null; // ISO date
  notes: string;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Relationships (personal CRM) ───────────────────────────────────────── */

export interface Relationship {
  id: string;
  name: string;
  type: RelationshipType;
  company: string;
  role: string;
  location: string;
  /** MM-DD — year-agnostic so birthdays recur without date maths on the row. */
  birthday: string | null;
  anniversary: string | null; // MM-DD
  interests: string[];
  notes: string;
  /** Explicit next follow-up; the engine also derives one from cadence. */
  nextFollowUpAt: string | null; // ISO date
  knowledgeNoteId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipInteraction {
  id: string;
  relationshipId: string;
  type: InteractionType;
  notes: string;
  occurredAt: string; // ISO
  createdAt: string;
}

/** Conferences, referrals, introductions — the networking ledger. */
export interface RelationshipEvent {
  id: string;
  relationshipId: string;
  title: string;
  /** "conference" | "referral" | "introduction" | "collaboration" | "recruitment". */
  kind: string;
  occurredAt: string; // ISO
  notes: string;
  createdAt: string;
}

/** Derived relationship health. Deterministic — counting and calendar maths, no scoring model. */
export interface RelationshipHealth {
  relationshipId: string;
  name: string;
  strength: RelationshipStrength;
  /** Interactions inside STRENGTH_WINDOW_DAYS. */
  interactionCount: number;
  daysSinceContact: number | null; // null = never contacted
  lastInteractionAt: string | null;
  /** 0–100, derived from recency + frequency. Not a prediction. */
  engagementScore: number;
  followUpDue: boolean;
}

/** A birthday/anniversary occurrence resolved against a concrete year. */
export interface UpcomingDate {
  relationshipId: string;
  name: string;
  kind: "birthday" | "anniversary";
  /** The next concrete occurrence, ISO date. */
  date: string;
  daysUntil: number;
}

/* ── Reviews ────────────────────────────────────────────────────────────── */

export interface ResourceReview {
  id: string;
  frequency: ResourceReviewFrequency;
  periodStart: string; // YYYY-MM-DD
  /** Net worth captured at review time — a snapshot, not a source of truth. */
  netWorth: number;
  notes: string;
  knowledgeNoteId: string | null;
  createdAt: string;
}

/* ── Derived cross-domain views ─────────────────────────────────────────── */

/** A renewal/expiry countdown, unified across insurance, documents and travel. */
export interface RenewalItem {
  id: string;
  name: string;
  /** Which engine owns it. */
  source: "insurance" | "document" | "travel" | "vehicle";
  expiresAt: string;
  daysUntil: number;
  expired: boolean;
}

export interface ForecastEntry {
  /** ISO date the cost lands on. */
  date: string;
  label: string;
  amount: number;
  source: "insurance" | "maintenance" | "vehicle" | "travel";
}

export interface ResourceForecast {
  horizonDays: number;
  entries: ForecastEntry[];
  total: number;
  /** Entries at or above LARGE_EXPENSE_THRESHOLD. */
  largeExpenses: ForecastEntry[];
}

/** Correlation between two numeric resource series (e.g. maintenance cost ↔ vehicle age). */
export interface ResourceCorrelation {
  label: string;
  coefficient: number; // -1..1
  samples: number;
}

/**
 * The whole-platform portfolio. ALWAYS derived, never stored — this is the object the
 * Morning slot, status bar and dashboard all read.
 */
export interface ResourcePortfolio {
  netWorth: number;
  assetValue: number;
  investmentValue: number;
  liabilities: number;
  insuranceCoverage: number;
  homeInventoryValue: number;
  relationshipCount: number;
  strongRelationships: number;
  dormantRelationships: number;
  upcomingRenewals: RenewalItem[];
  upcomingBirthdays: UpcomingDate[];
  documentsExpiring: RenewalItem[];
}

export interface ResourceStatistics {
  investmentCount: number;
  assetCount: number;
  vehicleCount: number;
  policyCount: number;
  documentCount: number;
  relationshipCount: number;
  interactionsThisMonth: number;
  maintenanceCompleted: number;
  maintenanceOverdue: number;
  /** Share of documents with a known, unexpired expiry — 0–100. */
  documentHealth: number;
}

/** Boolean facts the Decision engine consumes. No thresholds leak into the rules. */
export interface ResourceSignals {
  insuranceExpiring: boolean;
  documentExpiring: boolean;
  maintenanceOverdue: boolean;
  relationshipCold: boolean;
  portfolioUnbalanced: boolean;
  largeExpenseDue: boolean;
  investmentReviewDue: boolean;
}

/** The compact read model for Morning/Tomorrow/status bar. */
export interface ResourceSummary {
  netWorth: number;
  investmentValue: number;
  investmentGain: number;
  upcomingRenewals: number;
  upcomingBirthdays: number;
  followUpsDue: number;
  maintenanceOverdue: number;
  documentsExpiring: number;
  /** Name of the nearest birthday, when one falls inside BIRTHDAY_SOON_DAYS. */
  nextBirthday: string | null;
}
