import {
  Award,
  Bike,
  Bitcoin,
  BookOpen,
  BookUser,
  Boxes,
  Briefcase,
  Building2,
  Cake,
  CalendarClock,
  Car,
  Cloud,
  Coffee,
  Coins,
  CreditCard,
  FileText,
  Fingerprint,
  Gem,
  Gift,
  GraduationCap,
  Hammer,
  Handshake,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  LineChart,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Network,
  Package,
  Phone,
  PieChart,
  Plane,
  Presentation,
  Receipt,
  Share2,
  ShieldCheck,
  Smartphone,
  Sofa,
  Stamp,
  Syringe,
  TrendingUp,
  UserCog,
  UserRound,
  UserSearch,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  AssetType,
  DocumentType,
  InsuranceType,
  InteractionType,
  InvestmentType,
  NetworkingKind,
  RelationshipStrength,
  RelationshipType,
  TravelDocumentType,
  VehicleType,
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

// ── Type → icon maps for the guided pickers + scannable lists (Phase 1) ──────────
export const ASSET_TYPE_ICON: Record<AssetType, LucideIcon> = {
  electronics: Laptop,
  furniture: Sofa,
  jewelry: Gem,
  equipment: Hammer,
  property: Building2,
  collection: Boxes,
  digital: Cloud,
  vehicle: Car,
};

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  passport: "Passport",
  driving_license: "Driving license",
  pan: "PAN",
  aadhaar: "Aadhaar",
  certificate: "Certificate",
  medical: "Medical",
  insurance: "Insurance",
  property: "Property",
  tax: "Tax",
  academic: "Academic",
};

export const DOCUMENT_TYPE_ICON: Record<DocumentType, LucideIcon> = {
  passport: BookUser,
  driving_license: Car,
  pan: CreditCard,
  aadhaar: Fingerprint,
  certificate: Award,
  medical: HeartPulse,
  insurance: ShieldCheck,
  property: Home,
  tax: Receipt,
  academic: GraduationCap,
};

export const INSURANCE_TYPE_ICON: Record<InsuranceType, LucideIcon> = {
  health: HeartPulse,
  life: Heart,
  vehicle: Car,
  home: Home,
  travel: Plane,
  device: Smartphone,
};

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  scooter: "Scooter",
  bicycle: "Bicycle",
  other: "Other",
};

export const VEHICLE_TYPE_ICON: Record<VehicleType, LucideIcon> = {
  car: Car,
  motorcycle: Bike,
  scooter: Bike,
  bicycle: Bike,
  other: MoreHorizontal,
};

export const RELATIONSHIP_TYPE_ICON: Record<RelationshipType, LucideIcon> = {
  friend: UserRound,
  family: Users,
  mentor: GraduationCap,
  professor: BookOpen,
  colleague: Briefcase,
  manager: UserCog,
  recruiter: UserSearch,
  investor: TrendingUp,
  networking: Network,
};

export const INTERACTION_TYPE_LABEL: Record<InteractionType, string> = {
  call: "Call",
  meeting: "Meeting",
  email: "Email",
  message: "Message",
  coffee: "Coffee",
  conference: "Conference",
  travel: "Travel",
  gift: "Gift",
  follow_up: "Follow-up",
};

export const INTERACTION_TYPE_ICON: Record<InteractionType, LucideIcon> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  message: MessageCircle,
  coffee: Coffee,
  conference: Presentation,
  travel: Plane,
  gift: Gift,
  follow_up: CalendarClock,
};

export const NETWORKING_KIND_LABEL: Record<NetworkingKind, string> = {
  conference: "Conference",
  referral: "Referral",
  introduction: "Introduction",
  collaboration: "Collaboration",
  recruitment: "Recruitment",
};

export const NETWORKING_KIND_ICON: Record<NetworkingKind, LucideIcon> = {
  conference: Presentation,
  referral: Share2,
  introduction: Handshake,
  collaboration: Users,
  recruitment: UserSearch,
};

export const INVESTMENT_TYPE_LABEL: Record<InvestmentType, string> = {
  stock: "Stock",
  etf: "ETF",
  mutual_fund: "Mutual fund",
  bond: "Bond",
  crypto: "Crypto",
  fixed_deposit: "Fixed deposit",
  gold: "Gold",
  real_estate: "Real estate",
};

export const INVESTMENT_TYPE_ICON: Record<InvestmentType, LucideIcon> = {
  stock: TrendingUp,
  etf: LineChart,
  mutual_fund: PieChart,
  bond: FileText,
  crypto: Bitcoin,
  fixed_deposit: Landmark,
  gold: Coins,
  real_estate: Building2,
};

export const TRAVEL_DOCUMENT_TYPE_LABEL: Record<TravelDocumentType, string> = {
  passport: "Passport",
  visa: "Visa",
  travel_insurance: "Travel insurance",
  vaccination: "Vaccination",
  lounge_membership: "Lounge membership",
  frequent_flyer: "Frequent flyer",
};

export const TRAVEL_DOCUMENT_TYPE_ICON: Record<TravelDocumentType, LucideIcon> = {
  passport: BookUser,
  visa: Stamp,
  travel_insurance: ShieldCheck,
  vaccination: Syringe,
  lounge_membership: Sofa,
  frequent_flyer: Plane,
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
