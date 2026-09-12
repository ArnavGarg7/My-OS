import type { GoalPriority, GoalType } from "./constants";

/**
 * Built-in goal templates for the guided goal creator. Deterministic reference content (like the
 * exercise / nutrition catalogs): a starting menu of common outcomes grouped by goal type, each with a
 * sensible default priority and a suggested target-date horizon. The creator seeds a new goal from a
 * template; everything stays editable — nothing here is fabricated data, only a head start so the user
 * doesn't face a blank form. Pure: no Date, no IO, no randomness.
 */
export interface GoalTemplate {
  title: string;
  description?: string;
  priority: GoalPriority;
  /** Which target-date preset to pre-select when this template is chosen. */
  suggestedPreset: TargetDatePresetId;
}

export type TargetDatePresetId = "eom" | "m3" | "m6" | "eoy" | "y1" | "custom" | "none";

export interface TargetDatePreset {
  id: TargetDatePresetId;
  label: string;
  /** How the concrete date is derived from "today" (UI supplies today; core stays pure). */
  kind: "end-of-month" | "months" | "end-of-year" | "none" | "custom";
  months?: number;
}

export const TARGET_DATE_PRESETS: TargetDatePreset[] = [
  { id: "eom", label: "End of month", kind: "end-of-month" },
  { id: "m3", label: "In 3 months", kind: "months", months: 3 },
  { id: "m6", label: "In 6 months", kind: "months", months: 6 },
  { id: "eoy", label: "End of year", kind: "end-of-year" },
  { id: "y1", label: "In 1 year", kind: "months", months: 12 },
  { id: "custom", label: "Custom date", kind: "custom" },
  { id: "none", label: "No date", kind: "none" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (dt: Date) =>
  `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;

/**
 * Resolve a target-date preset to a concrete YYYY-MM-DD (or null for "no date"/"custom"), given today
 * as an ISO date string. Deterministic — all arithmetic is in UTC so the same inputs always map to the
 * same output. "custom" returns null so the UI can collect an explicit date instead.
 */
export function resolveTargetDate(preset: TargetDatePreset, todayISO: string): string | null {
  const base = new Date(`${todayISO}T00:00:00Z`);
  switch (preset.kind) {
    case "none":
    case "custom":
      return null;
    case "end-of-month":
      // Day 0 of next month = last day of this month.
      return isoDate(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)));
    case "end-of-year":
      return `${base.getUTCFullYear()}-12-31`;
    case "months":
      return isoDate(
        new Date(
          Date.UTC(
            base.getUTCFullYear(),
            base.getUTCMonth() + (preset.months ?? 0),
            base.getUTCDate(),
          ),
        ),
      );
  }
}

export const GOAL_TEMPLATES: Record<GoalType, GoalTemplate[]> = {
  career: [
    { title: "Get promoted to the next level", priority: "high", suggestedPreset: "y1" },
    { title: "Land a new job", priority: "high", suggestedPreset: "m6" },
    { title: "Ship a portfolio project", priority: "medium", suggestedPreset: "m3" },
    { title: "Complete a professional certification", priority: "medium", suggestedPreset: "m6" },
    { title: "Grow my professional network", priority: "low", suggestedPreset: "m6" },
  ],
  education: [
    { title: "Graduate on time", priority: "critical", suggestedPreset: "y1" },
    { title: "Hit my target GPA this semester", priority: "high", suggestedPreset: "m6" },
    { title: "Master a core subject", priority: "medium", suggestedPreset: "m3" },
    { title: "Finish an online course", priority: "medium", suggestedPreset: "m3" },
    { title: "Secure an internship", priority: "high", suggestedPreset: "m6" },
  ],
  health: [
    { title: "Reach my target weight", priority: "high", suggestedPreset: "m6" },
    { title: "Run a 5K", priority: "medium", suggestedPreset: "m3" },
    { title: "Build a consistent gym habit", priority: "high", suggestedPreset: "m3" },
    { title: "Improve my sleep quality", priority: "medium", suggestedPreset: "m3" },
    { title: "Cut down on sugar", priority: "low", suggestedPreset: "m3" },
  ],
  finance: [
    { title: "Build a 6-month emergency fund", priority: "high", suggestedPreset: "y1" },
    { title: "Pay off my debt", priority: "critical", suggestedPreset: "y1" },
    { title: "Save for a big purchase", priority: "medium", suggestedPreset: "y1" },
    { title: "Start investing regularly", priority: "medium", suggestedPreset: "m3" },
    { title: "Stick to a monthly budget", priority: "medium", suggestedPreset: "eom" },
  ],
  personal: [
    { title: "Build a daily reading habit", priority: "medium", suggestedPreset: "m3" },
    { title: "Start journaling", priority: "low", suggestedPreset: "m3" },
    { title: "Learn a new skill", priority: "medium", suggestedPreset: "m6" },
    { title: "Reduce my screen time", priority: "low", suggestedPreset: "m3" },
    { title: "Practice mindfulness daily", priority: "medium", suggestedPreset: "m3" },
  ],
  life: [
    { title: "Travel to a new country", priority: "medium", suggestedPreset: "y1" },
    { title: "Read 24 books this year", priority: "medium", suggestedPreset: "eoy" },
    { title: "Learn a new language", priority: "medium", suggestedPreset: "y1" },
    { title: "Establish a consistent morning routine", priority: "high", suggestedPreset: "m3" },
    { title: "Build a stronger social circle", priority: "low", suggestedPreset: "m6" },
  ],
};
