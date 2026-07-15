import {
  Activity,
  Apple,
  BatteryCharging,
  Bed,
  Droplet,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  Scale,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { EnergyLevel, RecoveryStatus } from "@myos/core/health";

/** Presentational icon + tone maps for the Health UI (Sprint 2.9). */
export const HEALTH_ICONS = {
  sleep: Bed,
  workout: Dumbbell,
  nutrition: Apple,
  water: Droplet,
  energy: Zap,
  recovery: BatteryCharging,
  body: Scale,
  readiness: Gauge,
  calories: Flame,
  activity: Activity,
  heart: HeartPulse,
} satisfies Record<string, LucideIcon>;

export const RECOVERY_LABEL: Record<RecoveryStatus, string> = {
  recovered: "Recovered",
  recovering: "Recovering",
  fatigued: "Fatigued",
  overtrained: "Overtrained",
};

export const RECOVERY_TONE: Record<RecoveryStatus, "success" | "warning" | "danger" | "neutral"> = {
  recovered: "success",
  recovering: "neutral",
  fatigued: "warning",
  overtrained: "danger",
};

export const ENERGY_LABEL: Record<EnergyLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function readinessTone(score: number): "success" | "warning" | "danger" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}
