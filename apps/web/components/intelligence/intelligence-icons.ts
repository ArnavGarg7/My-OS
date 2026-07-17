import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Flag,
  Gauge,
  Grid3x3,
  LayoutDashboard,
  Radar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { AttentionLevel, LifeArea, TrendDirection } from "@myos/core/intelligence";

/**
 * Intelligence icon + tone maps (Sprint 4.4). Pure presentation lookups for the executive
 * dashboard. No logic — every threshold and band lives in the core.
 */
export const DashboardIcon = LayoutDashboard;
export const SummaryIcon = Sparkles;
export const AttentionIcon = AlertTriangle;
export const WheelIcon = Radar;
export const ScorecardIcon = Gauge;
export const TrendsIcon = TrendingUp;
export const MatrixIcon = Grid3x3;
export const MilestoneIcon = Flag;
export const AchievementIcon = Award;
export const LifeAreaIcon = Activity;
export const AnalyticsIcon = BarChart3;

/** Badge tone per attention band — the five-level palette used platform-wide on the dashboard. */
export const ATTENTION_TONE: Record<
  AttentionLevel,
  "danger" | "warning" | "neutral" | "accent" | "success"
> = {
  needs_attention: "danger",
  at_risk: "warning",
  stable: "neutral",
  improving: "accent",
  excellent: "success",
};

export const ATTENTION_LABEL: Record<AttentionLevel, string> = {
  needs_attention: "Needs attention",
  at_risk: "At risk",
  stable: "Stable",
  improving: "Improving",
  excellent: "Excellent",
};

export const TREND_GLYPH: Record<TrendDirection, string> = {
  rising: "↑",
  falling: "↓",
  flat: "→",
};

export const TREND_TONE: Record<TrendDirection, "success" | "danger" | "neutral"> = {
  rising: "success",
  falling: "danger",
  flat: "neutral",
};

export const LIFE_AREA_ICON_KEY: Record<LifeArea, string> = {
  health: "heart-pulse",
  career: "briefcase",
  learning: "graduation-cap",
  finance: "wallet",
  relationships: "users",
  growth: "sparkles",
  productivity: "gauge",
  wellbeing: "sun",
};
