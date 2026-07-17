import {
  Cake,
  Car,
  FileText,
  Home,
  Package,
  Plane,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type {
  AssetType,
  InsuranceType,
  RelationshipStrength,
  RelationshipType,
} from "@myos/core/resource";

/**
 * Resource icon + tone maps (Sprint 4.3). Pure presentation lookups shared across the
 * Resource Platform — investments, assets, vehicles, insurance, documents, travel and the
 * personal CRM. No logic here; every threshold lives in core/constants.
 */
export const ResourceIcon = Wallet;
export const InvestmentIcon = TrendingUp;
export const AssetIcon = Package;
export const VehicleIcon = Car;
export const InsuranceIcon = ShieldCheck;
export const DocumentIcon = FileText;
export const TravelIcon = Plane;
export const RelationshipIcon = Users;
export const MaintenanceIcon = Wrench;
export const BirthdayIcon = Cake;
export const HomeIcon = Home;

/** Badge tone per relationship strength — mirrors the core's four bands. */
export const STRENGTH_TONE: Record<
  RelationshipStrength,
  "success" | "accent" | "warning" | "neutral"
> = {
  strong: "success",
  active: "accent",
  cooling: "warning",
  dormant: "neutral",
};

export const STRENGTH_LABEL: Record<RelationshipStrength, string> = {
  strong: "Strong",
  active: "Active",
  cooling: "Cooling",
  dormant: "Dormant",
};

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  electronics: "Electronics",
  furniture: "Furniture",
  jewelry: "Jewelry",
  equipment: "Equipment",
  property: "Property",
  collection: "Collection",
  digital: "Digital",
  vehicle: "Vehicle",
};

export const INSURANCE_TYPE_LABEL: Record<InsuranceType, string> = {
  health: "Health",
  life: "Life",
  vehicle: "Vehicle",
  home: "Home",
  travel: "Travel",
  device: "Device",
};

export const RELATIONSHIP_TYPE_LABEL: Record<RelationshipType, string> = {
  friend: "Friend",
  family: "Family",
  mentor: "Mentor",
  professor: "Professor",
  colleague: "Colleague",
  manager: "Manager",
  recruiter: "Recruiter",
  investor: "Investor",
  networking: "Networking",
};

/** ₹ formatting — the platform is single-currency, matching Finance (2.11). */
export function formatMoney(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** A signed gain, so a loss reads as a loss rather than a bare negative. */
export function formatGain(amount: number): string {
  const sign = amount >= 0 ? "+" : "−";
  return `${sign}₹${Math.abs(Math.round(amount)).toLocaleString("en-IN")}`;
}

/** "in 5 days" / "today" / "12 days ago" — used by every countdown in the platform. */
export function formatCountdown(days: number): string {
  if (days === 0) return "today";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  const overdue = Math.abs(days);
  return `${overdue} day${overdue === 1 ? "" : "s"} ago`;
}
