import {
  Briefcase,
  Compass,
  Flame,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { GoalForecast, GoalStatus, GoalType } from "@myos/core/goal";

/** Presentational icon + tone maps for the Goal UI (Sprint 2.12). */
export const GOAL_TYPE_ICON: Record<GoalType, LucideIcon> = {
  life: Compass,
  career: Briefcase,
  education: GraduationCap,
  health: HeartPulse,
  finance: Wallet,
  personal: Sparkles,
};

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  life: "Life",
  career: "Career",
  education: "Education",
  health: "Health",
  finance: "Finance",
  personal: "Personal",
};

export const STATUS_LABEL: Record<GoalStatus, string> = {
  planned: "Planned",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const STATUS_VARIANT: Record<GoalStatus, "neutral" | "accent" | "warning" | "success"> = {
  planned: "neutral",
  active: "accent",
  paused: "warning",
  completed: "success",
  archived: "neutral",
};

export const FORECAST_LABEL: Record<GoalForecast["status"], string> = {
  ahead: "Ahead",
  on_track: "On track",
  behind: "Behind",
  unknown: "—",
};

export const FORECAST_TONE: Record<GoalForecast["status"], string> = {
  ahead: "text-success",
  on_track: "text-success",
  behind: "text-danger",
  unknown: "text-fg-subtle",
};

export const GOAL_ICONS = { target: Target, habit: Flame, trophy: Trophy };
