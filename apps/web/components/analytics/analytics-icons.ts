import {
  Activity,
  BarChart3,
  Brain,
  CalendarDays,
  Flame,
  Folder,
  HeartPulse,
  Minus,
  NotebookPen,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { scoreBand } from "@myos/core/analytics";

/** Presentational maps for the Analytics UI (Sprint 2.14). */
export const SCORE_TONE: Record<ReturnType<typeof scoreBand>, string> = {
  excellent: "text-success",
  good: "text-success",
  fair: "text-warning",
  poor: "text-danger",
};

export const SCORE_DOT: Record<ReturnType<typeof scoreBand>, string> = {
  excellent: "bg-success",
  good: "bg-success",
  fair: "bg-warning",
  poor: "bg-danger",
};

export function scoreTone(score: number): string {
  return SCORE_TONE[scoreBand(score)];
}
export function scoreDot(score: number): string {
  return SCORE_DOT[scoreBand(score)];
}

export const SECTION_ICON = {
  productivity: BarChart3,
  focus: Zap,
  planner: CalendarDays,
  calendar: CalendarDays,
  projects: Folder,
  goals: Target,
  health: HeartPulse,
  finance: Wallet,
  journal: NotebookPen,
  timeline: Activity,
  brain: Brain,
  habit: Flame,
} as const;

export type Direction = "up" | "down" | "flat";

export const DIRECTION_ICON: Record<Direction, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

/** Whether an "up" trend is good depends on the metric; default: up = good. */
export function directionTone(direction: Direction, upIsGood = true): string {
  if (direction === "flat") return "text-fg-subtle";
  const good = upIsGood ? direction === "up" : direction === "down";
  return good ? "text-success" : "text-danger";
}

export function formatScore(score: number): string {
  return String(Math.round(score));
}

export function formatSigned(pct: number): string {
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
