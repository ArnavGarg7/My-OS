import {
  Activity,
  CalendarClock,
  Dumbbell,
  Flame,
  HeartPulse,
  ListChecks,
  Pill,
  Repeat,
  Sparkles,
  Stethoscope,
  Sunrise,
  Target,
} from "lucide-react";
import type { InjuryStatus, RecommendationLevel, RoutineType } from "@myos/core/life";

/**
 * Life icon + tone maps (Sprint 4.2). Pure presentation lookups shared by the Life
 * Platform — habits, routines, health, workouts, growth and readiness.
 */
export const LifeIcon = Activity;
export const HabitIcon = Repeat;
export const RoutineIcon = Sunrise;
export const WorkoutIcon = Dumbbell;
export const MedicationIcon = Pill;
export const AppointmentIcon = Stethoscope;
export const GrowthIcon = Target;
export const StreakIcon = Flame;
export const ReadinessIcon = HeartPulse;
export const StepsIcon = ListChecks;

export const ROUTINE_TYPE_LABEL: Record<RoutineType, string> = {
  morning: "Morning",
  evening: "Evening",
  workout: "Workout",
  study: "Study",
  travel: "Travel",
  weekend: "Weekend",
  custom: "Custom",
};

export const INJURY_STATUS_LABEL: Record<InjuryStatus, string> = {
  active: "Active",
  recovering: "Recovering",
  healed: "Healed",
};

export const INJURY_STATUS_BADGE: Record<InjuryStatus, "danger" | "warning" | "success"> = {
  active: "danger",
  recovering: "warning",
  healed: "success",
};

export const RECOMMENDATION_LABEL: Record<RecommendationLevel, string> = {
  push: "Push",
  maintain: "Maintain",
  ease: "Ease off",
  rest: "Rest",
};

export const RECOMMENDATION_BADGE: Record<
  RecommendationLevel,
  "success" | "accent" | "warning" | "danger"
> = {
  push: "success",
  maintain: "accent",
  ease: "warning",
  rest: "danger",
};

export const MEDICATION_FREQUENCY_LABEL: Record<string, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  thrice_daily: "3× daily",
  weekly: "Weekly",
  as_needed: "As needed",
};

export { CalendarClock, Sparkles };
