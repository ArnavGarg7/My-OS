import {
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Flag,
  ListChecks,
  MoonStar,
  Sparkles,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import type { StudioStep, TomorrowStatus } from "@myos/core/tomorrow";

/** Presentational maps for Tomorrow Studio (Sprint 3.1). */
export const STEP_ICON: Record<StudioStep, LucideIcon> = {
  review: ClipboardList,
  carry_forward: ListChecks,
  priorities: Flag,
  calendar: CalendarDays,
  planner: Sparkles,
  readiness: MoonStar,
  checklist: CheckSquare,
  finalize: Sunrise,
};

export const STATUS_VARIANT: Record<TomorrowStatus, "neutral" | "accent" | "warning" | "success"> =
  {
    draft: "neutral",
    planned: "accent",
    locked: "warning",
    completed: "success",
  };

export function readinessTone(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

export function minutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function eventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
