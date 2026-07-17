/**
 * Resource & Relationship Platform constants (Sprint 4.3). The deterministic system of
 * record for everything owned, managed and maintained: investments, assets, home, vehicles,
 * insurance, documents, travel identity and the personal CRM. Extends — never replaces —
 * Finance (2.11), Goals (2.12), Knowledge (4.1) and Life (4.2). No AI, no randomness, no
 * market APIs: every price and valuation is user-entered, every derived view is recomputed.
 *
 * Finance: how am I using my money? · Assets: what do I own? · Home: what do I maintain? ·
 * Relationships: who matters in my life? · Documents: what must I never lose?
 */

export const INVESTMENT_TYPES = [
  "stock",
  "etf",
  "mutual_fund",
  "bond",
  "crypto",
  "fixed_deposit",
  "gold",
  "real_estate",
] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const ASSET_TYPES = [
  "electronics",
  "furniture",
  "jewelry",
  "equipment",
  "property",
  "collection",
  "digital",
  "vehicle",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const DOCUMENT_TYPES = [
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
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  "friend",
  "family",
  "mentor",
  "professor",
  "colleague",
  "manager",
  "recruiter",
  "investor",
  "networking",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const INTERACTION_TYPES = [
  "call",
  "meeting",
  "email",
  "message",
  "coffee",
  "conference",
  "travel",
  "gift",
  "follow_up",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const MAINTENANCE_STATUSES = ["scheduled", "overdue", "completed"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const INSURANCE_TYPES = ["health", "life", "vehicle", "home", "travel", "device"] as const;
export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const VEHICLE_TYPES = ["car", "motorcycle", "scooter", "bicycle", "other"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** Travel/identity document sub-kinds tracked by the travel engine. */
export const TRAVEL_DOCUMENT_TYPES = [
  "passport",
  "visa",
  "travel_insurance",
  "vaccination",
  "lounge_membership",
  "frequent_flyer",
] as const;
export type TravelDocumentType = (typeof TRAVEL_DOCUMENT_TYPES)[number];

export const RESOURCE_REVIEW_FREQUENCIES = ["monthly", "quarterly", "annual"] as const;
export type ResourceReviewFrequency = (typeof RESOURCE_REVIEW_FREQUENCIES)[number];

/** Deterministic relationship-strength bands (derived, never stored). */
export const RELATIONSHIP_STRENGTHS = ["strong", "active", "cooling", "dormant"] as const;
export type RelationshipStrength = (typeof RELATIONSHIP_STRENGTHS)[number];

/* ── Thresholds ─────────────────────────────────────────────────────────── */

/** An insurance policy or travel document renewal is "upcoming" inside this window. */
export const RENEWAL_SOON_DAYS = 30;
/** Identity documents get a longer runway — renewals are slow. */
export const DOCUMENT_EXPIRY_SOON_DAYS = 90;
/** Birthdays surface in Morning/Notifications this far ahead. */
export const BIRTHDAY_SOON_DAYS = 7;
/** No contact for this long and the relationship is cooling. */
export const RELATIONSHIP_COLD_DAYS = 90;
/** No contact for this long and the relationship is dormant. */
export const RELATIONSHIP_DORMANT_DAYS = 180;
/** Contact inside this window counts as an active relationship. */
export const RELATIONSHIP_ACTIVE_DAYS = 30;
/** A strong relationship needs at least this many interactions in the strength window. */
export const STRONG_INTERACTION_COUNT = 4;
/** Rolling window used to compute interaction frequency + strength. */
export const STRENGTH_WINDOW_DAYS = 90;
/** A single investment type above this share of the portfolio is unbalanced. */
export const PORTFOLIO_CONCENTRATION_LIMIT = 0.4;
/** Portfolios go stale without a review after this long. */
export const INVESTMENT_REVIEW_DAYS = 90;
/** A forecast expense at or above this (₹) is "large" and worth a decision. */
export const LARGE_EXPENSE_THRESHOLD = 10_000;
/** Forecast horizon for renewals/maintenance/expenses. */
export const FORECAST_HORIZON_DAYS = 90;
/** Minimum paired samples before a correlation is reported at all. */
export const CORRELATION_MIN_SAMPLES = 5;

/**
 * Straight-line annual depreciation rates by asset type (fraction of purchase price per
 * year). Deterministic and user-overridable per asset; property/collections appreciate or
 * hold, so they depreciate at 0 and rely on an explicit current value.
 */
export const DEPRECIATION_RATES: Record<AssetType, number> = {
  electronics: 0.25,
  furniture: 0.1,
  jewelry: 0,
  equipment: 0.15,
  property: 0,
  collection: 0,
  digital: 0.2,
  vehicle: 0.15,
};

/** An asset never depreciates below this fraction of its purchase price. */
export const SALVAGE_FLOOR = 0.1;
