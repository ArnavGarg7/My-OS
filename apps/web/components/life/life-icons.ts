import {
  Activity,
  Briefcase,
  CalendarClock,
  Dumbbell,
  Flame,
  GraduationCap,
  HeartPulse,
  Leaf,
  ListChecks,
  Palette,
  Pill,
  Repeat,
  Sparkles,
  Stethoscope,
  Sunrise,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type {
  InjuryStatus,
  RecommendationLevel,
  RoutineType,
  VisionCategory,
} from "@myos/core/life";

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

export const VISION_CATEGORY_LABEL: Record<VisionCategory, string> = {
  health: "Health",
  career: "Career",
  relationships: "Relationships",
  finance: "Finance",
  learning: "Learning",
  personal: "Personal",
  spiritual: "Spiritual",
  recreation: "Recreation",
};

export const VISION_CATEGORY_ICON: Record<VisionCategory, LucideIcon> = {
  health: HeartPulse,
  career: Briefcase,
  relationships: Users,
  finance: Wallet,
  learning: GraduationCap,
  personal: Sparkles,
  spiritual: Leaf,
  recreation: Palette,
};

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
